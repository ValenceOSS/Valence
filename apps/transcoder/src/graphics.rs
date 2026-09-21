//! What the graphics hardware is doing.
//!
//! The figure worth having is encoder pressure: how loaded the dedicated
//! encode block is, because that is what decides whether another stream will
//! keep up. A card can be saturated at encoding while reading five percent
//! overall, so overall utilisation does not answer the question.
//!
//! Only NVIDIA reports the encode block separately. Where it cannot be had,
//! this reports what the whole card is doing instead and says which of the two
//! it measured, so nothing downstream can pass one off as the other. On Apple
//! silicon that distinction is not academic: hardware encoding runs on a media
//! engine that is not the GPU, and four saturated encodes leave overall
//! utilisation where it was.
//!
//! Intel has no whole-card counter Valence may read. `intel_gpu_top` is the
//! only route to one, it is not installed by default, and it reaches the
//! counters through `perf`, which a container refuses without `CAP_PERFMON`
//! and a host sysctl. Those are privileges Valence should not be asking for,
//! and that has not changed.
//!
//! What has changed is that the kernel now keeps a second set of books:
//! per-client engine times, published beside every open file on a render node
//! and readable by whoever opened it. Those cover only Valence's own work, so
//! they answer a narrower question than a vendor counter does — and they
//! answer it without asking anybody for anything. Where that is the only
//! reading available, it is reported as what it is. See [`crate::drm_clients`].

use std::collections::VecDeque;
use std::time::Duration;

use serde::Serialize;
use tokio::process::Command;

use crate::drm_clients::VideoEngine;

/// How many readings are averaged into the figure that is reported.
///
/// The counters are instantaneous and jump about: six readings three seconds
/// apart on an otherwise idle machine gave 22, 26, 23, 25, 26 and 0. Reporting
/// the latest sample alone makes a steady load look like it is flickering, and
/// makes an idle one occasionally look busy. A mean over the last few seconds
/// is the same quantity read steadily.
const SMOOTHING: usize = 5;

/// How long a vendor tool is given before it is treated as absent.
///
/// Generous, because this runs on its own timer where nothing is waiting for
/// it, and short enough that a wedged tool cannot pile up behind itself.
const PROBE_TIMEOUT: Duration = Duration::from_secs(3);

/// Whose work a figure accounts for.
///
/// A vendor counter covers the silicon, whoever is using it. The kernel's
/// per-client books cover only the clients Valence opened, because that is all
/// it will attribute without privileges Valence does not take. The two are
/// read the same way and mean different things, so which one produced a figure
/// travels with the figure.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum Measured {
    WholeMachine,
    ValenceOnly,
}

/// What the graphics hardware is doing, and which part of it was measured.
///
/// Both figures are optional and mean different things by their absence: no
/// encoder reading means this vendor does not report the encode block, not
/// that the block is idle.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GraphicsUse {
    pub name: String,
    /// How loaded the dedicated encode block is, where the vendor reports it.
    pub encoder_percent: Option<f32>,
    /// What the card as a whole is doing, which is a different question.
    pub device_percent: Option<f32>,
    pub measured: Measured,
}

/// Runs a vendor tool, and says why not where it gave no clean answer.
///
/// A missing tool, a tool that fails and a tool that hangs all mean this
/// machine cannot answer, but they are different problems with different
/// fixes, so each is told apart rather than being one silence.
async fn ask(program: &str, args: &[&str]) -> Result<String, String> {
    let call = Command::new(program).args(args).kill_on_drop(true).output();

    let outcome = match tokio::time::timeout(PROBE_TIMEOUT, call).await {
        Err(_) => {
            return Err(format!(
                "{program} did not answer within {} seconds",
                PROBE_TIMEOUT.as_secs()
            ));
        }
        Ok(Err(problem)) if problem.kind() == std::io::ErrorKind::NotFound => {
            return Err(format!("{program} is not installed in this container"));
        }
        Ok(Err(problem)) => return Err(format!("{program} could not be started: {problem}")),
        Ok(Ok(outcome)) => outcome,
    };

    if outcome.status.success() {
        return Ok(String::from_utf8_lossy(&outcome.stdout).into_owned());
    }

    let said = String::from_utf8_lossy(&outcome.stderr);
    let said = said.lines().next().unwrap_or("").trim();

    Err(if said.is_empty() {
        format!("{program} exited with {}", outcome.status)
    } else {
        format!("{program} exited with {}: {said}", outcome.status)
    })
}

/// The digits straight after a key, as a percentage.
fn number_after(text: &str, key: &str) -> Option<f32> {
    let rest = text.split_once(key)?.1;
    let digits: String = rest.chars().take_while(char::is_ascii_digit).collect();

    digits.parse().ok()
}

/// The quoted string straight after a key.
///
/// The angle brackets are stepped over because the registry prints the same
/// property as plain text on one machine and as data on another, and which of
/// those you get is not something worth depending on.
fn quoted_after(text: &str, key: &str) -> Option<String> {
    let rest = text.split_once(key)?.1.trim_start();
    let inner = rest.trim_start_matches('<').strip_prefix('"')?;

    Some(inner[..inner.find('"')?].to_owned())
}

/// What `nvidia-smi` said, which is the only vendor answer that names the
/// encode block on its own.
///
/// A card that does not support the encoder counter prints `[N/A]`, which
/// fails to parse and is reported as no reading — which is what it is. A card
/// that prints `[N/A]` for both is not an answer at all, and is passed over so
/// that the sources after this one are still asked, rather than a name with no
/// numbers ending the search. Where a machine lists several cards, the first
/// that has a figure is the one reported.
fn parse_nvidia(output: &str) -> Result<GraphicsUse, String> {
    let mut named_without_figures = None;

    for line in output.lines().filter(|line| !line.trim().is_empty()) {
        let mut fields = line.split(',').map(str::trim);

        let (Some(name), Some(device), Some(encoder)) =
            (fields.next(), fields.next(), fields.next())
        else {
            continue;
        };

        if name.is_empty() {
            continue;
        }

        let reading = GraphicsUse {
            name: name.to_owned(),
            encoder_percent: encoder.parse().ok(),
            device_percent: device.parse().ok(),
            measured: Measured::WholeMachine,
        };

        if reading.encoder_percent.is_some() || reading.device_percent.is_some() {
            return Ok(reading);
        }

        named_without_figures.get_or_insert_with(|| {
            format!("nvidia-smi named {name} but gave no utilisation for it (it said {device}, {encoder})")
        });
    }

    Err(named_without_figures.unwrap_or_else(|| {
        format!(
            "nvidia-smi answered with nothing this can read: {}",
            output.lines().next().unwrap_or("nothing").trim()
        )
    }))
}

/// What the IO registry said about the accelerator on an Apple machine.
///
/// Overall utilisation only. The encoder is a separate media engine that
/// publishes its capabilities and no load counter, so there is nothing here to
/// report about it at any privilege short of root, and root does not have it
/// either.
///
/// Read a node at a time rather than as one dump, because a machine can have
/// more than one accelerator and taking the figure from one while taking the
/// name from another would describe a card that does not exist.
///
/// Nothing here is particular to a generation. Every Apple accelerator
/// registers under `IOAccelerator` whatever its class is called that year, and
/// the two figures are read by name. `Device Utilization %` is the whole-card
/// figure where a machine publishes it; `Renderer Utilization %` is the same
/// question asked of the shader cores, and stands in where it does not.
fn parse_apple(output: &str) -> Option<GraphicsUse> {
    output.split("+-o ").find_map(|node| {
        let device = number_after(node, "\"Device Utilization %\"=")
            .or_else(|| number_after(node, "\"Renderer Utilization %\"="))?;

        Some(GraphicsUse {
            name: quoted_after(node, "\"model\" =").unwrap_or_else(|| "Apple graphics".to_owned()),
            encoder_percent: None,
            device_percent: Some(device),
            measured: Measured::WholeMachine,
        })
    })
}

async fn read_nvidia() -> Result<GraphicsUse, String> {
    parse_nvidia(
        &ask(
            "nvidia-smi",
            &[
                "--query-gpu=name,utilization.gpu,utilization.encoder",
                "--format=csv,noheader,nounits",
            ],
        )
        .await
        .map_err(|why| {
            if why.contains("not installed") {
                format!(
                    "{why}; the NVIDIA container toolkit only brings it when \
                     NVIDIA_DRIVER_CAPABILITIES includes utility"
                )
            } else {
                why
            }
        })?,
    )
}

async fn read_apple() -> Result<GraphicsUse, String> {
    parse_apple(&ask("ioreg", &["-r", "-d", "1", "-c", "IOAccelerator"]).await?)
        .ok_or_else(|| "ioreg listed no accelerator with a utilisation figure".to_owned())
}

/// What the kernel driver said about an AMD card.
///
/// Read from sysfs rather than a tool, so this needs nothing installed and no
/// privileges. Overall utilisation only: the driver does not break out the
/// encode block.
async fn read_amd() -> Result<GraphicsUse, String> {
    let mut cards = tokio::fs::read_dir("/sys/class/drm")
        .await
        .map_err(|problem| {
            format!("/sys/class/drm cannot be read from this container: {problem}")
        })?;

    let mut looked_at = Vec::new();

    while let Ok(Some(card)) = cards.next_entry().await {
        let device = card.path().join("device");

        let Ok(busy) = tokio::fs::read_to_string(device.join("gpu_busy_percent")).await else {
            looked_at.push(card.file_name().to_string_lossy().into_owned());

            continue;
        };

        let Ok(percent) = busy.trim().parse::<f32>() else {
            continue;
        };

        return Ok(GraphicsUse {
            name: tokio::fs::read_to_string(device.join("product_name"))
                .await
                .map(|name| name.trim().to_owned())
                .ok()
                .filter(|name| !name.is_empty())
                .unwrap_or_else(|| "AMD graphics".to_owned()),
            encoder_percent: None,
            device_percent: Some(percent),
            measured: Measured::WholeMachine,
        });
    }

    Err(if looked_at.is_empty() {
        "/sys/class/drm lists no graphics cards inside this container".to_owned()
    } else {
        format!(
            "none of {} has a gpu_busy_percent to read, which the amdgpu driver publishes \
             and other drivers do not",
            looked_at.join(", ")
        )
    })
}

/// A card's recent readings, and the steady figure they average to.
///
/// Absence is not a low reading, so a poll that finds no card empties this
/// rather than averaging a gap: a card that has been unplugged, or a tool that
/// has stopped answering, must not leave a fading number behind that looks
/// like a measurement.
#[derive(Default)]
pub struct Smoothed {
    encoder: VecDeque<f32>,
    device: VecDeque<f32>,
}

/// The mean of what is there, and nothing when nothing is.
fn mean(readings: &VecDeque<f32>) -> Option<f32> {
    let total: f32 = readings.iter().sum();

    (!readings.is_empty()).then(|| total / f32::from(u8::try_from(readings.len()).unwrap_or(1)))
}

impl Smoothed {
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    /// Takes a reading and gives back what should be reported.
    pub fn push(&mut self, reading: Option<GraphicsUse>) -> Option<GraphicsUse> {
        let Some(reading) = reading else {
            self.encoder.clear();
            self.device.clear();

            return None;
        };

        for (readings, latest) in [
            (&mut self.encoder, reading.encoder_percent),
            (&mut self.device, reading.device_percent),
        ] {
            if let Some(value) = latest {
                readings.push_back(value);
            }

            while readings.len() > SMOOTHING {
                readings.pop_front();
            }
        }

        Some(GraphicsUse {
            name: reading.name,
            encoder_percent: mean(&self.encoder),
            device_percent: mean(&self.device),
            measured: reading.measured,
        })
    }
}

/// What the kernel's own per-client books say, for a card no vendor tool here
/// will speak about.
///
/// The card is found in sysfs and the figure comes from the books, and they
/// are deliberately separate questions. A machine with an Intel card and
/// nothing transcoding has a card worth naming and no work to report, and
/// saying "no card Valence can read" of it would be false.
async fn read_drm(engine: &mut VideoEngine) -> Result<GraphicsUse, String> {
    let card = crate::drm_clients::card().await.ok_or_else(|| {
        "no render node under /sys/class/drm, which is what a transcode opens; \
         /dev/dri says nothing about /sys"
            .to_owned()
    })?;

    Ok(GraphicsUse {
        name: crate::pci_names::name(card).await,
        encoder_percent: engine.read().await,
        device_percent: None,
        measured: Measured::ValenceOnly,
    })
}

/// What the sources were asked, and what they said.
///
/// A card with no figure and a machine nobody could ask are different things,
/// and without this both were one empty tile. `notes` says, for each source
/// that had nothing to report, why not — and is empty once a figure was found,
/// since what a source that was never needed said is noise.
#[derive(Debug, Clone, Default)]
pub struct Reading {
    pub graphics: Option<GraphicsUse>,
    pub notes: Vec<String>,
}

/// Everything needed to keep asking one machine the same question.
///
/// The per-client books are totals rather than rates, so a figure only exists
/// against the last reading — which means this poller has to remember one.
/// Smoothing is held here for the same reason and was always stateful; it has
/// simply stopped being the only thing that is.
#[derive(Default)]
pub struct Reader {
    smoothed: Smoothed,
    engine: VideoEngine,
}

/// Whether a reading carries a number, rather than only a name.
fn has_a_figure(reading: &GraphicsUse) -> bool {
    reading.encoder_percent.is_some() || reading.device_percent.is_some()
}

/// Takes what one source said: its reading where it has a number, and otherwise what to remember
/// about why it did not.
fn weigh(
    source: &str,
    attempt: Result<GraphicsUse, String>,
    notes: &mut Vec<String>,
    named_only: &mut Option<GraphicsUse>,
) -> Option<GraphicsUse> {
    match attempt {
        Ok(reading) if has_a_figure(&reading) => Some(reading),
        Ok(reading) => {
            notes.push(format!(
                "{source}: {} has no utilisation figure to report yet",
                reading.name
            ));
            named_only.get_or_insert(reading);

            None
        }
        Err(why) => {
            notes.push(format!("{source}: {why}"));

            None
        }
    }
}

impl Reader {
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    /// What the graphics hardware is doing, from whichever source answers.
    ///
    /// Tried in the order of how much they can tell us, so a machine with an
    /// NVIDIA card beside an integrated one reports the one that can speak
    /// about its encoder, and a card whose driver publishes a whole-machine
    /// figure is read that way rather than through Valence's own share of it.
    ///
    /// A source that names a card but has no number for it does not end the
    /// search: the sources after it are still asked, and the name is what is
    /// reported only where none of them has a figure either.
    pub async fn read(&mut self) -> Reading {
        let mut notes = Vec::new();
        let mut named_only: Option<GraphicsUse> = None;

        let mut found = weigh("NVIDIA", read_nvidia().await, &mut notes, &mut named_only);

        if found.is_none() {
            found = weigh("AMD", read_amd().await, &mut notes, &mut named_only);
        }

        if found.is_none() {
            found = weigh(
                "kernel",
                read_drm(&mut self.engine).await,
                &mut notes,
                &mut named_only,
            );
        }

        if found.is_none() && cfg!(target_os = "macos") {
            match read_apple().await {
                Ok(reading) => found = Some(reading),
                Err(why) => notes.push(format!("Apple: {why}")),
            }
        }

        let graphics = self.smoothed.push(found.or(named_only));

        Reading {
            notes: if graphics.as_ref().is_some_and(has_a_figure) {
                Vec::new()
            } else {
                notes
            },
            graphics,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{parse_apple, parse_nvidia, weigh, GraphicsUse, Measured, Smoothed};

    fn card(encoder: Option<f32>, device: Option<f32>) -> GraphicsUse {
        GraphicsUse {
            name: "Card".to_owned(),
            encoder_percent: encoder,
            device_percent: device,
            measured: Measured::WholeMachine,
        }
    }

    #[test]
    fn reports_the_first_reading_as_it_stands() {
        let mut smoothed = Smoothed::new();

        assert_eq!(
            smoothed
                .push(Some(card(None, Some(40.0))))
                .and_then(|use_| use_.device_percent),
            Some(40.0)
        );
    }

    #[test]
    fn steadies_a_counter_that_jumps_about() {
        let mut smoothed = Smoothed::new();

        for reading in [22.0, 26.0, 23.0, 25.0] {
            smoothed.push(Some(card(None, Some(reading))));
        }

        let steady = smoothed
            .push(Some(card(None, Some(0.0))))
            .and_then(|use_| use_.device_percent)
            .expect("there are readings to average");

        assert!(
            (19.0..20.0).contains(&steady),
            "one idle sample should not empty the pane, got {steady}"
        );
    }

    #[test]
    fn forgets_readings_older_than_the_window() {
        let mut smoothed = Smoothed::new();

        for _ in 0..5 {
            smoothed.push(Some(card(None, Some(0.0))));
        }

        for _ in 0..5 {
            smoothed.push(Some(card(None, Some(80.0))));
        }

        assert_eq!(
            smoothed
                .push(Some(card(None, Some(80.0))))
                .and_then(|use_| use_.device_percent),
            Some(80.0),
            "a window of high readings must not be held down by older ones"
        );
    }

    #[test]
    fn never_averages_an_encoder_reading_into_existence() {
        let mut smoothed = Smoothed::new();

        let reading = smoothed
            .push(Some(card(None, Some(40.0))))
            .expect("a card answered");

        assert_eq!(reading.encoder_percent, None);
    }

    #[test]
    fn drops_what_it_knew_when_the_card_stops_answering() {
        let mut smoothed = Smoothed::new();

        smoothed.push(Some(card(Some(90.0), Some(90.0))));

        assert!(smoothed.push(None).is_none());
        assert_eq!(
            smoothed
                .push(Some(card(None, Some(10.0))))
                .and_then(|use_| use_.device_percent),
            Some(10.0),
            "a card that comes back starts again rather than fading from the old figure"
        );
    }

    const IOREG: &str = r#"+-o AGXAcceleratorG17X  <class AGXAcceleratorG17X, id 0x100000775>
    {
      "PerformanceStatistics" = {"Alloc system memory"=5796593664,"Tiler Utilization %"=21,"Renderer Utilization %"=33,"Device Utilization %"=41,"In use system memory"=1284358144}
      "model" = "Apple M5 Pro"
      "IOClass" = "AGXAcceleratorG17X"
    }
"#;

    #[test]
    fn reads_what_the_whole_apple_card_is_doing() {
        let reading = parse_apple(IOREG).expect("the dump has a utilisation figure");

        assert_eq!(reading.device_percent, Some(41.0));
        assert_eq!(reading.name, "Apple M5 Pro");
    }

    #[test]
    fn never_claims_an_encoder_reading_apple_cannot_give() {
        let reading = parse_apple(IOREG).expect("the dump has a utilisation figure");

        assert_eq!(
            reading.encoder_percent, None,
            "an unreadable encoder must not read as an idle one"
        );
    }

    #[test]
    fn says_nothing_about_a_dump_with_no_figure_in_it() {
        assert!(parse_apple("+-o AGXAcceleratorG17X\n{\n}\n").is_none());
    }

    #[test]
    fn names_a_card_whose_model_it_could_not_read() {
        let reading = parse_apple("\"Device Utilization %\"=7").expect("there is a figure");

        assert_eq!(reading.name, "Apple graphics");
    }

    #[test]
    fn reads_a_model_the_registry_printed_as_data_rather_than_text() {
        let reading = parse_apple(
            "+-o AGXAcceleratorG13X\n\"model\" = <\"Apple M1 Max\">\n\"Device Utilization %\"=12",
        )
        .expect("there is a figure");

        assert_eq!(reading.name, "Apple M1 Max");
    }

    #[test]
    fn falls_back_to_the_renderer_figure_on_a_machine_that_omits_the_device_one() {
        let reading = parse_apple("+-o AGXAcceleratorG13G\n\"Renderer Utilization %\"=64")
            .expect("there is a figure");

        assert_eq!(reading.device_percent, Some(64.0));
    }

    #[test]
    fn keeps_a_name_and_a_figure_from_the_same_card() {
        let reading = parse_apple(
            "+-o IOAccelerator\n\"model\" = \"Idle card\"\n+-o AGXAcceleratorG17X\n\"model\" = \"Apple M5 Pro\"\n\"Device Utilization %\"=41",
        )
        .expect("the second node has a figure");

        assert_eq!(reading.name, "Apple M5 Pro");
        assert_eq!(reading.device_percent, Some(41.0));
    }

    #[test]
    fn reads_the_encode_block_where_nvidia_reports_it() {
        let reading = parse_nvidia("NVIDIA GeForce RTX 4070, 34, 88\n").expect("a figure");

        assert_eq!(reading.name, "NVIDIA GeForce RTX 4070");
        assert_eq!(reading.encoder_percent, Some(88.0));
        assert_eq!(reading.device_percent, Some(34.0));
    }

    #[test]
    fn keeps_the_card_when_it_will_not_speak_about_its_encoder() {
        let reading = parse_nvidia("NVIDIA T400, 12, [N/A]\n").expect("a figure");

        assert_eq!(reading.encoder_percent, None);
        assert_eq!(reading.device_percent, Some(12.0));
    }

    #[test]
    fn reports_only_the_first_card_rather_than_adding_them_up() {
        let reading = parse_nvidia("NVIDIA A, 10, 20\nNVIDIA B, 90, 90\n").expect("a figure");

        assert_eq!(reading.name, "NVIDIA A");
        assert_eq!(reading.encoder_percent, Some(20.0));
    }

    #[test]
    fn keeps_a_reading_labelled_as_the_machine_rather_than_as_our_share_of_it() {
        let reading = parse_nvidia("NVIDIA T400, 12, 30\n").expect("a figure");

        assert_eq!(reading.measured, Measured::WholeMachine);
    }

    #[test]
    fn carries_what_a_figure_measures_through_the_smoothing() {
        let mut smoothed = Smoothed::new();

        let reading = smoothed
            .push(Some(GraphicsUse {
                name: "Intel UHD Graphics 770".to_owned(),
                encoder_percent: Some(30.0),
                device_percent: None,
                measured: Measured::ValenceOnly,
            }))
            .expect("a card answered");

        assert_eq!(
            reading.measured,
            Measured::ValenceOnly,
            "averaging a figure must not turn our own share into the whole machine"
        );
    }

    #[test]
    fn says_nothing_about_output_it_does_not_understand() {
        assert!(parse_nvidia("").is_err());
        assert!(parse_nvidia("Failed to initialise NVML\n").is_err());
    }

    #[test]
    fn passes_over_a_card_that_names_itself_and_gives_no_figures() {
        let why = parse_nvidia("NVIDIA GeForce RTX 5080, [N/A], [N/A]\n")
            .expect_err("a name with no numbers is not an answer");

        assert!(
            why.contains("RTX 5080"),
            "the reason should name the card: {why}"
        );
    }

    #[test]
    fn takes_the_first_card_that_has_a_figure() {
        let reading = parse_nvidia("NVIDIA A, [N/A], [N/A]\nNVIDIA B, 40, [N/A]\n")
            .expect("the second card has a figure");

        assert_eq!(reading.name, "NVIDIA B");
    }

    #[test]
    fn keeps_the_reason_a_source_had_nothing() {
        let mut notes = Vec::new();
        let mut named = None;

        let found = weigh(
            "NVIDIA",
            Err("nvidia-smi is not installed in this container".to_owned()),
            &mut notes,
            &mut named,
        );

        assert!(found.is_none());
        assert_eq!(
            notes,
            ["NVIDIA: nvidia-smi is not installed in this container"]
        );
    }

    #[test]
    fn remembers_a_card_that_has_a_name_and_no_figure_without_ending_the_search() {
        let mut notes = Vec::new();
        let mut named = None;

        let found = weigh(
            "kernel",
            Ok(card_named("Intel UHD")),
            &mut notes,
            &mut named,
        );

        assert!(found.is_none(), "a name alone must not end the search");
        assert_eq!(named.map(|card| card.name), Some("Intel UHD".to_owned()));
        assert_eq!(notes.len(), 1);
    }

    #[test]
    fn takes_a_reading_that_has_a_figure() {
        let mut notes = Vec::new();
        let mut named = None;

        let found = weigh("AMD", Ok(card(None, Some(40.0))), &mut notes, &mut named);

        assert_eq!(found.and_then(|reading| reading.device_percent), Some(40.0));
        assert!(notes.is_empty());
    }

    fn card_named(name: &str) -> GraphicsUse {
        GraphicsUse {
            name: name.to_owned(),
            ..card(None, None)
        }
    }
}
