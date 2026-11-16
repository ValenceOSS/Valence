//! Casting to Chromecasts and other Google Cast devices, from the app itself: a web view has no
//! Cast SDK, so the app finds devices on the network, speaks the Cast v2 protocol to the one chosen,
//! and tells the page how the cast stands.

pub mod caster;
pub mod devices;
pub mod frame;
pub mod link;
pub mod messages;
pub mod session;

use std::sync::Arc;

use caster::{reachable_from, this_computers_network_address, Caster, CastingNow, Told};
use reqwest::Url;
use tauri::{AppHandle, Emitter, Manager, State};

/// The event the page hears where casting stands on, whenever it changes.
pub const CHANGED: &str = "valence:cast-changed";

/// The event the page hears how the media on the device stands on.
pub const PLAYED: &str = "valence:cast-played";

const LONGEST_TITLE: usize = 1024;
const LONGEST_CONTENT_TYPE: usize = 128;

/// Where casting stands, for a page catching up.
#[tauri::command]
#[must_use]
#[allow(
    clippy::needless_pass_by_value,
    reason = "Tauri hands a command what it was asked with by value"
)]
pub fn cast_now(caster: State<'_, Arc<Caster>>) -> CastingNow {
    caster.now()
}

/// Connects to a device; whether it is now being cast to.
///
/// # Errors
///
/// Never; a command run in the background has to be able to say it failed.
#[tauri::command]
pub async fn cast_connect(
    device_id: String,
    caster: State<'_, Arc<Caster>>,
) -> Result<bool, String> {
    Ok(caster.inner().connect(&device_id).await)
}

/// The whole address of `path` on the chosen server, or `path` itself where it is already a whole
/// web address.
fn address_of(app: &AppHandle, path: &str) -> Option<Url> {
    if let Ok(whole) = Url::parse(path) {
        return matches!(whole.scheme(), "http" | "https").then_some(whole);
    }

    crate::upstream::upstream(app)?.url_for(path)
}

/// The whole address a device on the network fetches `path` on the server from — a server on this
/// computer named by the address the network reaches it at — for a device the web view plays to
/// itself, such as an Apple TV.
#[tauri::command]
#[must_use]
#[allow(
    clippy::needless_pass_by_value,
    reason = "Tauri hands a command what it was asked with by value"
)]
pub fn cast_address_of(app: AppHandle, path: String) -> Option<String> {
    let url = address_of(&app, &path)?;
    let reachable = match this_computers_network_address() {
        Some(here) => reachable_from(url, here),
        None => url,
    };

    Some(reachable.to_string())
}

/// Hands the device being cast to a stream on the server; whether it took it.
///
/// # Errors
///
/// Never; a command run in the background has to be able to say it failed.
#[tauri::command]
pub async fn cast_load(
    app: AppHandle,
    path: String,
    content_type: String,
    title: String,
    start_seconds: f64,
    caster: State<'_, Arc<Caster>>,
) -> Result<bool, String> {
    if title.len() > LONGEST_TITLE
        || content_type.is_empty()
        || content_type.len() > LONGEST_CONTENT_TYPE
        || !start_seconds.is_finite()
    {
        return Ok(false);
    }

    let Some(url) = address_of(&app, &path) else {
        return Ok(false);
    };

    Ok(caster
        .load(url, &content_type, &title, start_seconds.max(0.0))
        .await)
}

/// Plays what the device holds.
#[tauri::command]
#[allow(
    clippy::needless_pass_by_value,
    reason = "Tauri hands a command what it was asked with by value"
)]
pub fn cast_play(caster: State<'_, Arc<Caster>>) {
    caster.play();
}

/// Pauses what the device holds.
#[tauri::command]
#[allow(
    clippy::needless_pass_by_value,
    reason = "Tauri hands a command what it was asked with by value"
)]
pub fn cast_pause(caster: State<'_, Arc<Caster>>) {
    caster.pause();
}

/// Moves what the device holds to `seconds`.
#[tauri::command]
#[allow(
    clippy::needless_pass_by_value,
    reason = "Tauri hands a command what it was asked with by value"
)]
pub fn cast_seek(seconds: f64, caster: State<'_, Arc<Caster>>) {
    if seconds.is_finite() {
        caster.seek(seconds);
    }
}

/// Sets the device's volume, from nothing to all of it.
#[tauri::command]
#[allow(
    clippy::needless_pass_by_value,
    reason = "Tauri hands a command what it was asked with by value"
)]
pub fn cast_volume(level: f64, caster: State<'_, Arc<Caster>>) {
    if level.is_finite() {
        caster.set_volume(level);
    }
}

/// Stops casting.
///
/// # Errors
///
/// Never; a command run in the background has to be able to say it failed.
#[tauri::command]
pub async fn cast_disconnect(caster: State<'_, Arc<Caster>>) -> Result<(), String> {
    caster.disconnect().await;
    Ok(())
}

/// Starts hearing Cast devices on the network, telling the page what there is to cast to; a network
/// that cannot be listened on leaves nothing to cast to.
pub fn setup(app: &tauri::App) {
    let telling = app.handle().clone();
    let caster = Arc::new(Caster::new(Arc::new(move |told| {
        let _ = match told {
            Told::Changed(now) => telling.emit(CHANGED, now),
            Told::Played(played) => telling.emit(PLAYED, played),
        };
    })));
    let hearing = Arc::clone(&caster);

    app.manage(caster);
    devices::browse_for_cast_devices(move |devices| hearing.heard_devices(devices));
}

#[cfg(test)]
mod tests;
