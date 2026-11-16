//! Films and episodes kept on this computer to watch offline.

pub mod coalesced;
pub mod folder;
pub mod held_file;
pub mod index;
pub mod keep_a_download;
pub mod library;
pub mod now;
pub mod trickplay;
pub mod words;

use crate::runtime::spawn;
use crate::serve::held_file::is_a_uuid;
use held_file::{HeldFile, WhatToKeep};
use index::{HeldIndex, HELD_INDEX_FILE};
use library::HeldLibrary;
use tauri::{Emitter, Manager, State};

/// The event the page hears the whole list of held files on, whenever any of it changes.
pub const HELD_CHANGED: &str = "valence:held-changed";

/// Everything kept, and how far each has come.
///
/// # Errors
///
/// Never; a command run in the background has to be able to say it failed.
#[tauri::command]
pub async fn held_all(library: State<'_, HeldLibrary>) -> Result<Vec<HeldFile>, String> {
    Ok(library.all().await)
}

/// Starts keeping something.
///
/// # Errors
///
/// When what was asked for is not something that can be kept, or the held folder cannot be made.
#[tauri::command]
pub async fn held_keep(
    what: serde_json::Value,
    library: State<'_, HeldLibrary>,
) -> Result<(), String> {
    let what = WhatToKeep::from_value(what).ok_or_else(|| String::from("not a WhatToKeep"))?;

    library
        .keep(what)
        .await
        .map_err(|problem| problem.to_string())
}

/// Stops keeping something and removes its files.
///
/// # Errors
///
/// When the download id is not one, or a file cannot be removed.
#[tauri::command]
pub async fn held_drop(download_id: String, library: State<'_, HeldLibrary>) -> Result<(), String> {
    let download_id = a_download_id(download_id)?;

    library
        .let_go(&download_id)
        .await
        .map_err(|problem| problem.to_string())
}

/// Pauses or resumes keeping something.
///
/// # Errors
///
/// When the download id is not one.
#[tauri::command]
pub async fn held_pause(
    download_id: String,
    is_paused: bool,
    library: State<'_, HeldLibrary>,
) -> Result<(), String> {
    let download_id = a_download_id(download_id)?;

    library.pause(&download_id, is_paused).await;

    Ok(())
}

/// Lets through a download id shaped like one, so no path is ever built out of anything else.
fn a_download_id(download_id: String) -> Result<String, String> {
    if is_a_uuid(&download_id) {
        Ok(download_id)
    } else {
        Err(String::from("not a download id"))
    }
}

/// Opens the library of held files, tells the page whenever it changes, and carries on with what
/// was interrupted: now, and whenever the server can be reached again.
///
/// # Errors
///
/// When the upstream client was not set up first.
pub fn setup(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let handle = app.handle().clone();
    let index = HeldIndex::open(crate::paths::conf_folder().join(HELD_INDEX_FILE));
    let library = HeldLibrary::new(
        crate::paths::held_folder(),
        index,
        crate::upstream::upstream(&handle).ok_or("the upstream client was not set up first")?,
        now::now_as_iso,
    );

    let telling = handle.clone();
    library.when_changed(move |held| {
        let _ = telling.emit(HELD_CHANGED, held);
    });

    if let Some(reach) = crate::reach::reach(&handle) {
        let carrying_on = library.clone();

        reach.when_changed(move |is_reachable| {
            if is_reachable {
                let library = carrying_on.clone();
                spawn(async move { library.carry_on_where_it_left_off().await });
            }
        });
    }

    let starting = library.clone();
    spawn(async move { starting.carry_on_where_it_left_off().await });

    app.manage(library);

    Ok(())
}
