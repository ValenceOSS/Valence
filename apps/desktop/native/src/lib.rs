//! What the desktop app asks of its operating system that Electron cannot ask for it: a passkey,
//! through Windows Hello on Windows.

mod window_handle;
#[cfg(windows)]
mod windows_hello;
