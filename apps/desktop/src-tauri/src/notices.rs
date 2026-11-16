//! Opening what a notification is about once somebody clicks it.
//!
//! The page puts its notices up through Tauri's notification plugin, which waits on each one off
//! the main thread for the system to say it was clicked: the default action on Linux, the toast's
//! activation on Windows and the click macOS reports. A click brings the window forward and tells
//! the page which notice it was, by the number the page gave it, so the page opens what it was
//! about, as a click on a browser's notification does.

use tauri::{AppHandle, Emitter};
use tauri_plugin_notification::NotificationExt;

/// The event a page hears when one of its notices was clicked, carrying the notice's number.
pub const NOTICE_OPENED: &str = "valence:notice-opened";

/// What the plugin calls a click on the notification itself, rather than on one of its buttons.
const CLICKED: &str = "tap";

/// The number of the notice a click opens: the notice's own, where what was done to it was a
/// click on the notice itself, and none for anything else.
#[must_use]
pub fn opened(action: &str, notice: Option<i32>) -> Option<i32> {
    notice.filter(|_| action == CLICKED)
}

/// Brings the window forward and tells the page that the notice numbered `notice` was clicked.
fn open(app: &AppHandle, notice: i32) {
    crate::window::bring_forward(app);

    if let Err(error) = app.emit(NOTICE_OPENED, notice) {
        eprintln!("Valence could not tell the page a notification was clicked: {error}");
    }
}

/// Gets this part of the app ready: follows every click on a notice the page put up. Following
/// clicks is also what has the plugin wait on each notice for one.
///
/// # Errors
///
/// When the notification plugin is not there to follow.
pub fn setup(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let handle = app.handle().clone();

    app.notification().on_action(move |performed| {
        let notice = performed
            .notification()
            .map(tauri_plugin_notification::ActiveNotification::id);

        if let Some(notice) = opened(performed.action_id(), notice) {
            open(&handle, notice);
        }
    })?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::opened;

    #[test]
    fn opens_a_notice_only_for_a_click_on_the_notice_itself() {
        assert_eq!(opened("tap", Some(7)), Some(7));
        assert_eq!(opened("reply", Some(7)), None);
        assert_eq!(opened("dismiss", Some(7)), None);
        assert_eq!(opened("tap", None), None);
    }
}
