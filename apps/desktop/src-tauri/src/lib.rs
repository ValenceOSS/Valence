//! Valence's desktop app: a window onto a Valence server, hosted by Tauri.

/// Builds and runs the app until its last window closes.
pub fn run() {
    if let Err(error) = tauri::Builder::default().run(tauri::generate_context!()) {
        eprintln!("Valence could not start: {error}");
    }
}
