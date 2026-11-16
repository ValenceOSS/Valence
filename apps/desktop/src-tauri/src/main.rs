//! Starts Valence's desktop app.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    valence_desktop::run();
}
