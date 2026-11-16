//! Keeping the screen on while something plays.
//!
//! A browser holds the screen on only for a page served over a secure address, and a server on a
//! home network often is not one, so the app does it for the page. The hold is let go when the page
//! says playing stopped, when the window loads another page, and when the window closes.
//!
//! One thread holds it from start to finish, since Windows ties a hold to the thread that took it.

use std::sync::mpsc::{channel, Sender};
use std::sync::{Mutex, PoisonError};

use tauri::{AppHandle, Manager};

/// Asks the thread holding the screen on to hold it or let it go.
pub struct Screen(Mutex<Sender<bool>>);

impl Screen {
    /// Starts the thread that holds the screen on.
    #[must_use]
    pub fn start() -> Self {
        let (asked, asks) = channel::<bool>();

        std::thread::spawn(move || {
            let mut held: Option<keepawake::KeepAwake> = None;

            for is_on in asks {
                if !is_on {
                    held = None;
                } else if held.is_none() {
                    held = keepawake::Builder::default()
                        .display(true)
                        .idle(true)
                        .reason(crate::say::say("common.valence", &[]))
                        .app_name(crate::say::say("common.valence", &[]))
                        .app_reverse_domain("app.valence.desktop")
                        .create()
                        .map_err(|error| eprintln!("Valence could not keep the screen on: {error}"))
                        .ok();
                }
            }

            drop(held);
        });

        Self(Mutex::new(asked))
    }

    /// Holds the screen on, or lets it go.
    pub fn keep_on(&self, is_on: bool) {
        let asked = self.0.lock().unwrap_or_else(PoisonError::into_inner);
        let _ = asked.send(is_on);
    }
}

/// Lets the screen sleep again.
pub fn let_go(app: &AppHandle) {
    if let Some(screen) = app.try_state::<Screen>() {
        screen.keep_on(false);
    }
}

/// Keeps the screen on, or lets it sleep again.
#[tauri::command]
#[allow(
    clippy::needless_pass_by_value,
    reason = "Tauri hands a command what it was asked with by value"
)]
pub fn keep_the_screen_on(app: AppHandle, is_on: bool) {
    if let Some(screen) = app.try_state::<Screen>() {
        screen.keep_on(is_on);
    }
}

/// Starts the thread that holds the screen on.
pub fn setup(app: &tauri::App) {
    app.manage(Screen::start());
}
