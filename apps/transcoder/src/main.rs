use std::env;
use std::path::PathBuf;
use std::time::Duration;

use tracing_subscriber::layer::SubscriberExt as _;
use tracing_subscriber::util::SubscriberInitExt as _;
use valence_transcoder::monitor::JournalLayer;
use valence_transcoder::router::{create_router, AppState};
use valence_transcoder::session::{SessionConfig, SessionRegistry};
use valence_transcoder::{capability, probe};

const DEFAULT_FFMPEG: &str = "ffmpeg";
const DEFAULT_FFPROBE: &str = "ffprobe";
const DEFAULT_SOCKET: &str = "/run/valence-transcoder.sock";
const UNIX_PREFIX: &str = "unix:";
const REAP_INTERVAL: Duration = Duration::from_secs(30);

/// How often spent transcode directories are reclaimed.
///
/// Nothing here is urgent — a directory nobody is watching costs disk and
/// nothing else — and the sweep reads the size of every one of them, so it is
/// not something to do every half minute beside the reaper.
const SWEEP_INTERVAL: Duration = Duration::from_secs(15 * 60);

fn setting(variable: &str, fallback: &str) -> String {
    env::var(variable).unwrap_or_else(|_| fallback.to_owned())
}

fn from_env(variable: &str) -> Option<String> {
    env::var(variable).ok()
}

/// Where the media service should listen.
#[derive(Debug, PartialEq, Eq)]
enum ListenTarget {
    Socket(String),
    Address(String),
}

/// Takes the socket path out of the address the server dials.
///
/// Only the `unix:` form is shared. One path both binds and dials a socket, so
/// a single setting genuinely serves both ends; a network address is not
/// shareable that way, because the host the server connects to is rarely the
/// interface this process should bind to. That case keeps its own setting.
fn socket_from_url(url: &str) -> Option<&str> {
    url.strip_prefix(UNIX_PREFIX)
}

/// Decides where to listen, most specific setting winning.
///
/// `TRANSCODER_URL` is the variable the server already dials, so leaving both
/// ends to it is what stops them disagreeing: there is no second setting to
/// forget. `VALENCE_TRANSCODER_ADDR` and `VALENCE_TRANSCODER_SOCKET` stay for a
/// deployment that puts the two halves on different machines, where the two
/// addresses genuinely are different things.
///
/// A variable set to nothing counts as one not set at all: a compose file that
/// names a variable it has no value for exports an empty string, which is not
/// a path and should not be taken for one.
fn listen_target(read: &impl Fn(&str) -> Option<String>) -> ListenTarget {
    let configured = |variable: &str| read(variable).filter(|value| !value.trim().is_empty());

    if let Some(address) = configured("VALENCE_TRANSCODER_ADDR") {
        return ListenTarget::Address(address);
    }

    if let Some(socket) = configured("VALENCE_TRANSCODER_SOCKET") {
        return ListenTarget::Socket(socket);
    }

    let shared =
        configured("TRANSCODER_URL").and_then(|url| socket_from_url(&url).map(str::to_owned));

    ListenTarget::Socket(shared.unwrap_or_else(|| DEFAULT_SOCKET.to_owned()))
}

fn session_config(ffmpeg: String, ffprobe: String) -> SessionConfig {
    let defaults = SessionConfig::default();

    SessionConfig {
        ffmpeg,
        ffprobe,
        device: from_env("VALENCE_VAAPI_DEVICE").unwrap_or(defaults.device),
        cache_root: env::var("VALENCE_TRANSCODE_DIR").map_or(defaults.cache_root, PathBuf::from),
        artefact_root: env::var("VALENCE_ARTEFACT_DIR")
            .map_or(defaults.artefact_root, PathBuf::from),
        idle_timeout: env::var("VALENCE_SESSION_IDLE_SECONDS")
            .ok()
            .and_then(|value| value.parse().ok())
            .map_or(defaults.idle_timeout, Duration::from_secs),
        manifest_timeout: env::var("VALENCE_MANIFEST_TIMEOUT_SECONDS")
            .ok()
            .and_then(|value| value.parse().ok())
            .map_or(defaults.manifest_timeout, Duration::from_secs),
        max_concurrent: env::var("VALENCE_MAX_CONCURRENT_TRANSCODES")
            .ok()
            .and_then(|value| value.parse().ok())
            .unwrap_or(defaults.max_concurrent),
    }
}

/// Collects idle sessions on a timer.
///
/// A closed browser tab sends no notification, so without this a transcode
/// outlives the viewer that asked for it.
fn spawn_reaper(registry: SessionRegistry) {
    tokio::spawn(async move {
        loop {
            tokio::time::sleep(REAP_INTERVAL).await;

            let collected = registry.collect_idle().await;

            if collected > 0 {
                tracing::info!(target: "sessions", "reaped {collected} idle session(s)");
            }
        }
    });
}

/// Reclaims spent transcode directories on a timer.
///
/// Separate from the reaper because they undo different things: that one frees
/// the process a closed tab left running, this one frees the disk a finished
/// transcode left behind. Collecting a session deliberately leaves its
/// directory, since the next viewer of the same thing plays it without
/// encoding anything — but nothing was ever giving that space back.
///
/// Far rarer than the reaper. A directory nobody is watching costs only disk,
/// and disk is what there is most of.
///
/// Sweeps before it first sleeps, because a restart is exactly when abandoned
/// directories exist: a service killed mid-transcode leaves one behind, and
/// waiting a quarter of an hour to notice serves nobody.
fn spawn_sweeper(registry: SessionRegistry) {
    let root = registry.config().cache_root.clone();

    tokio::spawn(async move {
        let budget = valence_transcoder::session_sweep::Budget::default();

        loop {
            let live = registry.live_ids().await;
            let report = valence_transcoder::session_sweep::evict(&root, &live, &budget).await;

            if report.removed > 0 {
                tracing::info!(
                    target: "cache",
                    "reclaimed {} spent transcode(s), {} bytes",
                    report.removed,
                    report.freed_bytes
                );
            }

            tokio::time::sleep(SWEEP_INTERVAL).await;
        }
    });
}

/// Says, once, whether previews will still be there after the next update.
///
/// The failure this exists for is silent by construction: everything works,
/// nothing errors, and the artefacts are gone at the next restart. An operator
/// finds out weeks later by noticing their library is rendering again. So the
/// service checks where it is about to write and says so at boot, where the
/// answer sits beside the version it was running when it mattered.
async fn report_durability(
    registry: &SessionRegistry,
    monitor: &valence_transcoder::monitor::Monitor,
) {
    let root = registry.config().artefact_root.clone();

    let Some(durability) = valence_transcoder::durability::of(&root).await else {
        return;
    };

    monitor
        .note_artefacts(valence_transcoder::monitor::ArtefactStore {
            root: root.display().to_string(),
            survives_restart: durability.survives_restart,
        })
        .await;

    if durability.survives_restart {
        tracing::info!(
            target: "cache",
            "previews and thumbnails are kept on {} ({})",
            durability.mount.display(),
            durability.filesystem
        );

        return;
    }

    tracing::warn!(
        target: "cache",
        "{}",
        valence_transcoder::durability::warning(&root, &durability)
    );
}

async fn serve(registry: SessionRegistry, ffmpeg: String, ffprobe: String) {
    let journal = valence_transcoder::monitor::Journal::new();

    let filter = tracing_subscriber::EnvFilter::try_from_env("RUST_LOG")
        .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info"));

    tracing_subscriber::registry()
        .with(filter)
        .with(tracing_subscriber::fmt::layer().with_writer(std::io::stderr))
        .with(JournalLayer::new(journal.clone()))
        .init();

    tracing::info!(
        target: "service",
        "{}",
        capability::describe_build(&ffmpeg, &capability::read_version(&ffmpeg).await)
    );

    let state = AppState {
        registry: registry.clone(),
        ffprobe,
        downloads: valence_transcoder::progress_registry::ProgressRegistry::new(),
        trickplay: valence_transcoder::trickplay::TrickplayRegistry::new(),
        previews: valence_transcoder::preview::PreviewRegistry::new(),
        monitor: valence_transcoder::monitor::Monitor::new(journal),
        audio: valence_transcoder::audio::AudioRegistry::new(),
        queue: valence_transcoder::queue::WorkQueue::new(chosen_background_jobs().unwrap_or(1))
            .with_lane("fingerprint", fingerprint_jobs()),
        renditions: valence_transcoder::progress_registry::ProgressRegistry::new(),
        media_roots: env::var("VALENCE_MEDIA_ROOTS")
            .map(|value| value.split(':').map(PathBuf::from).collect())
            .unwrap_or_default(),
        write_roots: env::var("VALENCE_WRITE_ROOTS")
            .map(|value| value.split(':').map(PathBuf::from).collect())
            .unwrap_or_default(),
    };

    state.monitor.watch_graphics();
    state
        .monitor
        .watch_cache(state.registry.config().artefact_root.clone());

    report_durability(&registry, &state.monitor).await;

    spawn_width_keeper(state.queue.clone(), registry.clone(), ffmpeg.clone());

    let router = create_router(state);

    spawn_reaper(registry.clone());
    spawn_sweeper(registry.clone());

    let result = match listen_target(&from_env) {
        ListenTarget::Address(address) => {
            tracing::info!(target: "service", "listening on {address}");

            match tokio::net::TcpListener::bind(&address).await {
                Ok(listener) => axum::serve(listener, router).await,
                Err(error) => {
                    eprintln!("could not bind {address}: {error}");
                    eprintln!("set VALENCE_TRANSCODER_ADDR to an interface this process can bind");
                    return;
                }
            }
        }
        ListenTarget::Socket(socket) => {
            if let Err(error) = tokio::fs::remove_file(&socket).await {
                if error.kind() != std::io::ErrorKind::NotFound {
                    tracing::debug!(target: "service", %error, "could not clear a stale socket file");
                }
            }

            tracing::info!(target: "service", "listening on {socket}");

            match tokio::net::UnixListener::bind(&socket) {
                Ok(listener) => axum::serve(listener, router).await,
                Err(error) => {
                    eprintln!("could not bind {socket}: {error}");
                    eprintln!(
                        "set TRANSCODER_URL to {UNIX_PREFIX}<path> somewhere writable — the server dials the same variable"
                    );
                    return;
                }
            }
        }
    };

    if let Err(error) = result {
        eprintln!("server stopped: {error}");
    }

    registry.stop_all().await;
}

/// How many background renders the operator asked for, where they asked.
fn chosen_background_jobs() -> Option<usize> {
    env::var("VALENCE_BACKGROUND_JOBS")
        .ok()
        .and_then(|value| value.parse().ok())
        .filter(|count: &usize| *count > 0)
}

/// The most background renders the device's own measurement is trusted for.
///
/// Measured on an RTX 5080, eight episodes each drawn as a sheet and a
/// preview: one at a time took 143.5 seconds, two 73.5, three 54.0 and four
/// 42.7 — close to linear — while eight took 33.0, twice the sessions and the
/// device memory for a quarter less time. Four takes most of what there is to
/// take and leaves the rest for whatever else the card is doing.
const MEASURED_CEILING: usize = 4;

/// How often the watch on playback looks again.
///
/// A viewer's transcode waits on its first segment for longer than this, so
/// renders going back to one at a time is settled before it matters.
const WATCH_INTERVAL: Duration = Duration::from_secs(2);

/// The most background renders to run at once while nobody is watching.
///
/// Asked of the device rather than fixed. This was worked out from the core
/// count once — half of them, capped at four — on the reasoning that an ffmpeg
/// process takes every core it is given. That reasoning is about processors,
/// and a render on a graphics chip is not bound by processors: it costs a
/// session and a share of the device's memory, of which there are a fixed
/// number however many cores sit beside them. Four renders at once against one
/// iGPU exhausted it, which read as "-17 (File exists)" and an encoder that
/// would not open; ten took the whole API down with it. So it became one, for
/// every machine, which left a card with two decode engines using one.
///
/// [`capability::Capabilities::concurrent_renders`] is that question asked
/// properly, by opening sessions until the device refuses, so an iGPU answers
/// small and is held to it. It counts sessions rather than engines and so
/// runs ahead of what is worth running, which is what [`MEASURED_CEILING`]
/// answers. Nothing measured means one, as before; an operator's number is
/// taken as it is.
fn background_width(chosen: Option<usize>, measured: u32) -> usize {
    chosen.unwrap_or_else(|| {
        usize::try_from(measured)
            .unwrap_or(1)
            .clamp(1, MEASURED_CEILING)
    })
}

/// Widens the queue once the device has been measured, and narrows what it
/// uses to one while anybody is watching.
///
/// A background render shares the decode and encode engines with the film
/// being watched, and [`valence_transcoder::steps_aside::steps_aside`] answers only for the
/// processor. So the extra slots are held back whenever a transcode session is
/// open, and handed back when the last one closes — the promise the queue has
/// always made, that background work never crowds the film, kept at a width
/// that uses the machine when there is no film to crowd.
///
/// The measured width is applied only where nobody has changed it in the
/// seconds the measuring takes: an operator who moved the Jobs card's slider
/// meanwhile meant what they chose. The watch keeps running whatever the width,
/// because the slider can raise it later.
fn spawn_width_keeper(
    queue: valence_transcoder::queue::WorkQueue,
    registry: SessionRegistry,
    ffmpeg: String,
) {
    let starting = queue.concurrency();

    tokio::spawn(async move {
        let device = registry.config().device.clone();
        let measured = capability::detect_capabilities(&ffmpeg, &device)
            .await
            .concurrent_renders;
        let width = background_width(chosen_background_jobs(), measured);

        if queue.concurrency() == starting {
            queue.set_concurrency(width);
        }

        tracing::info!(
            target: "service",
            "running up to {} background jobs at once, and one while anybody is watching",
            queue.concurrency()
        );

        let mut held = None;

        loop {
            let watching = !registry.is_empty().await;

            if watching && held.is_none() {
                held = queue.hold_all_but_one().await;
            } else if !watching && held.is_some() {
                held = None;
            }

            tokio::time::sleep(WATCH_INTERVAL).await;
        }
    });
}

/// How many files may be fingerprinted at once.
///
/// More than one, unlike every other kind of background work, because
/// fingerprinting is an audio decode and some arithmetic rather than a render:
/// it spends most of its time waiting on a disk, so running several overlaps
/// the waiting rather than competing for the machine. A library's worth of it
/// done strictly one file at a time is hours of a job nobody is waiting on.
///
/// Capped rather than set to the core count, because several decodes reading
/// several large files at once is a demand on storage rather than on
/// processors, and storage is what this actually waits for.
fn fingerprint_jobs() -> usize {
    const AT_MOST: usize = 4;

    env::var("VALENCE_FINGERPRINT_JOBS")
        .ok()
        .and_then(|value| value.parse().ok())
        .unwrap_or_else(|| {
            std::thread::available_parallelism()
                .map_or(1, std::num::NonZeroUsize::get)
                .min(AT_MOST)
        })
}

#[tokio::main]
async fn main() {
    let ffmpeg = setting("VALENCE_FFMPEG", DEFAULT_FFMPEG);
    let ffprobe = setting("VALENCE_FFPROBE", DEFAULT_FFPROBE);

    let arguments: Vec<String> = env::args().skip(1).collect();

    match arguments.split_first() {
        Some((command, rest)) if command == "probe" => {
            let Some(path) = rest.first() else {
                eprintln!("usage: valence-transcoder probe <file>");
                return;
            };

            match probe::probe_media(&ffprobe, &PathBuf::from(path)).await {
                Ok(result) => println!(
                    "{}",
                    serde_json::to_string_pretty(&result).unwrap_or_else(|_| "{}".to_owned())
                ),
                Err(error) => eprintln!("probe failed: {error}"),
            }
        }
        Some((command, _)) if command == "capabilities" => {
            let capabilities = capability::detect_capabilities(
                &ffmpeg,
                &session_config(ffmpeg.clone(), ffprobe.clone()).device,
            )
            .await;

            println!(
                "{}",
                serde_json::to_string_pretty(&capabilities).unwrap_or_else(|_| "{}".to_owned())
            );
        }
        Some((command, _)) if command == "serve" => {
            let registry = SessionRegistry::new(session_config(ffmpeg.clone(), ffprobe.clone()));

            serve(registry, ffmpeg, ffprobe).await;
        }
        _ => {
            println!("valence-transcoder {}", env!("CARGO_PKG_VERSION"));
            println!("commands: serve, probe <file>, capabilities");
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{
        background_width, listen_target, socket_from_url, ListenTarget, DEFAULT_SOCKET,
        MEASURED_CEILING,
    };

    fn reading(pairs: &[(&str, &str)]) -> impl Fn(&str) -> Option<String> {
        let owned: Vec<(String, String)> = pairs
            .iter()
            .map(|(name, value)| ((*name).to_owned(), (*value).to_owned()))
            .collect();

        move |variable: &str| {
            owned
                .iter()
                .find(|(name, _)| name == variable)
                .map(|(_, value)| value.clone())
        }
    }

    #[test]
    fn takes_the_socket_the_server_dials() {
        assert_eq!(
            socket_from_url("unix:/tmp/valence.sock"),
            Some("/tmp/valence.sock")
        );
    }

    #[test]
    fn leaves_a_network_address_to_its_own_setting() {
        assert_eq!(socket_from_url("http://transcoder.internal:9000"), None);
    }

    #[test]
    fn binds_the_socket_the_server_was_told_to_dial() {
        let target = listen_target(&reading(&[("TRANSCODER_URL", "unix:/tmp/valence.sock")]));

        assert_eq!(target, ListenTarget::Socket("/tmp/valence.sock".to_owned()));
    }

    #[test]
    fn falls_back_to_the_packaged_socket_when_nothing_is_set() {
        let target = listen_target(&reading(&[]));

        assert_eq!(target, ListenTarget::Socket(DEFAULT_SOCKET.to_owned()));
    }

    #[test]
    fn keeps_the_packaged_socket_when_the_server_dials_over_the_network() {
        let target = listen_target(&reading(&[("TRANSCODER_URL", "http://transcoder:9000")]));

        assert_eq!(target, ListenTarget::Socket(DEFAULT_SOCKET.to_owned()));
    }

    #[test]
    fn lets_an_explicit_address_win() {
        let target = listen_target(&reading(&[
            ("TRANSCODER_URL", "unix:/tmp/valence.sock"),
            ("VALENCE_TRANSCODER_ADDR", "0.0.0.0:9000"),
        ]));

        assert_eq!(target, ListenTarget::Address("0.0.0.0:9000".to_owned()));
    }

    #[test]
    fn lets_an_explicit_socket_win() {
        let target = listen_target(&reading(&[
            ("TRANSCODER_URL", "unix:/tmp/dialled.sock"),
            ("VALENCE_TRANSCODER_SOCKET", "/tmp/bound.sock"),
        ]));

        assert_eq!(target, ListenTarget::Socket("/tmp/bound.sock".to_owned()));
    }

    #[test]
    fn treats_a_variable_set_to_nothing_as_unset() {
        let target = listen_target(&reading(&[
            ("VALENCE_TRANSCODER_ADDR", ""),
            ("VALENCE_TRANSCODER_SOCKET", "   "),
            ("TRANSCODER_URL", "unix:/tmp/valence.sock"),
        ]));

        assert_eq!(target, ListenTarget::Socket("/tmp/valence.sock".to_owned()));
    }

    /// A card that measures eight sessions is trusted for four: the rest
    /// bought a quarter less time for twice the sessions.
    #[test]
    fn trusts_a_measurement_only_as_far_as_the_ceiling() {
        assert_eq!(background_width(None, 8), MEASURED_CEILING);
    }

    /// An iGPU that measures small is held to it — four at once is what
    /// exhausted one, before anything was measured.
    #[test]
    fn holds_a_small_device_to_what_it_measured() {
        assert_eq!(background_width(None, 2), 2);
    }

    #[test]
    fn runs_one_at_a_time_where_nothing_was_measured() {
        assert_eq!(background_width(None, 0), 1);
    }

    #[test]
    fn takes_the_operators_number_as_it_is() {
        assert_eq!(background_width(Some(6), 2), 6);
        assert_eq!(background_width(Some(1), 8), 1);
    }
}
