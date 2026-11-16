//! Telling Discord what is playing, through the socket the Discord client opens on this machine.
//!
//! The page says what is playing; what it says is read before it is trusted, since it ends up in
//! somebody's public status. The status comes down when the window that set it closes — closing
//! the window is not quitting everywhere, and on macOS Valence goes on running — and when the app
//! quits.

mod activity;
mod frame;
mod tell_discord;
mod what_is_playing;
mod where_discord_listens;

use activity::Build;
use futures_util::FutureExt;
use std::collections::HashSet;
use std::sync::{Arc, Mutex, PoisonError};
use std::time::{Duration, SystemTime};
use tauri::{AppHandle, Manager, RunEvent, Window, WindowEvent};
use tell_discord::{tell_discord, Connection, Connector, Presence};

/// How long quitting waits for the status to come down.
const LONG_ENOUGH_TO_CLEAR: Duration = Duration::from_secs(1);

/// The windows whose closing takes the status down.
#[derive(Default)]
struct Watched(Mutex<HashSet<String>>);

/// How this machine opens a connection to Discord: a Unix socket.
#[cfg(unix)]
fn the_connector() -> Connector {
    Arc::new(|path| {
        async move {
            let connection: Box<dyn Connection> =
                Box::new(tokio::net::UnixStream::connect(path).await?);

            Ok(connection)
        }
        .boxed()
    })
}

/// How this machine opens a connection to Discord: a named pipe.
#[cfg(windows)]
fn the_connector() -> Connector {
    Arc::new(|path| {
        async move {
            let connection: Box<dyn Connection> =
                Box::new(tokio::net::windows::named_pipe::ClientOptions::new().open(path)?);

            Ok(connection)
        }
        .boxed()
    })
}

/// What Node calls this system, which is what the places Discord listens are worked out for.
fn this_platform() -> &'static str {
    if cfg!(windows) {
        "win32"
    } else if cfg!(target_os = "macos") {
        "darwin"
    } else {
        "linux"
    }
}

/// Takes the status down when a window that set it closes, the first time that window says
/// anything.
fn take_the_status_down_with(window: &Window, presence: &Presence) {
    let Some(watched) = window.try_state::<Watched>() else {
        return;
    };
    let is_new = watched
        .0
        .lock()
        .unwrap_or_else(PoisonError::into_inner)
        .insert(window.label().to_owned());

    if is_new {
        let presence = presence.clone();

        window.on_window_event(move |event| {
            if matches!(event, WindowEvent::Destroyed) {
                presence.about(None);
            }
        });
    }
}

/// Tells Discord what is playing now, or that nothing is, as the page said it.
#[tauri::command]
#[allow(
    clippy::needless_pass_by_value,
    reason = "Tauri hands a command what it was asked with by value"
)]
pub fn now_watching(app: AppHandle, window: Window, said: serde_json::Value) {
    let Some(presence) = app.try_state::<Presence>() else {
        return;
    };

    take_the_status_down_with(&window, &presence);
    presence.about(what_is_playing::what_is_playing(&said));
}

/// Gets this part of the app ready, before the window opens: nothing is connected until something
/// is said, and the status comes down as the app quits.
///
/// # Errors
///
/// When Tauri will not take the part that hears the app quit.
pub fn setup(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let about = crate::about::about(app.handle());
    let opened_at = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .ok()
        .and_then(|since| i64::try_from(since.as_millis()).ok())
        .unwrap_or_default();
    let temporary = std::env::temp_dir();
    let paths = where_discord_listens::where_discord_listens(
        this_platform(),
        |name| std::env::var(name).ok(),
        &temporary.to_string_lossy(),
    );
    let presence = tell_discord(
        paths,
        the_connector(),
        opened_at,
        Some(Build {
            version: about.version,
            is_a_dev_build: about.is_a_dev_build,
        }),
        tauri::async_runtime::handle().inner(),
    );
    let quitting = presence.clone();

    app.manage(presence);
    app.manage(Watched::default());
    app.handle().plugin(
        tauri::plugin::Builder::<tauri::Wry>::new("valence-discord")
            .on_event(move |_, event| {
                if matches!(event, RunEvent::Exit) {
                    tauri::async_runtime::block_on(async {
                        let _ = tokio::time::timeout(LONG_ENOUGH_TO_CLEAR, quitting.close()).await;
                    });
                }
            })
            .build(),
    )?;

    Ok(())
}
