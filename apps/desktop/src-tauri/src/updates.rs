//! Updating this app: in an installed build only, looking for a release every few hours, fetching
//! it when somebody asks, and restarting into it with a small window to look at meanwhile.

mod feed;
mod follow;
mod install_mark;
mod tauri_updater;
mod update_log;
mod update_window;

use follow::{follow_the_updates, DesktopUpdate, Followed, Needs, CHECK_EVERY};
use futures_util::FutureExt;
use install_mark::InstallMark;
use std::sync::Arc;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager, WebviewWindow};
use tauri_updater::TauriUpdater;
use update_log::UpdateLog;
use update_window::{open_the_update_window, Step};

/// How long the update window stays up before the app goes on.
const SHOW_THE_UPDATE_FOR: Duration = Duration::from_millis(1200);

/// The longest the update window is waited for, so a page that never draws holds nothing up.
const LONGEST_TO_OPEN: Duration = Duration::from_secs(10);

/// How often the finishing window looks for the main window having shown.
const LOOK_FOR_THE_WINDOW_EVERY: Duration = Duration::from_millis(100);

/// The longest the finishing window waits for the main window.
const LONGEST_FINISH: Duration = Duration::from_secs(30);

/// The event the page hears a change in what is known on.
const UPDATE_CHANGED: &str = "valence:update-changed";

/// The label of the window Valence is drawn in.
const MAIN_WINDOW: &str = crate::window::MAIN;

/// The updates being followed, where this build follows them at all.
struct Updates(Option<Arc<Followed<TauriUpdater>>>);

/// The window Valence is drawn in, where it is open.
fn the_main_window(app: &AppHandle) -> Option<WebviewWindow> {
    app.get_webview_window(MAIN_WINDOW)
}

/// The updates being followed, where they are.
fn followed(app: &AppHandle) -> Option<Arc<Followed<TauriUpdater>>> {
    app.try_state::<Updates>()
        .and_then(|updates| updates.0.as_ref().map(Arc::clone))
}

/// What is known about an update now, for the page as it loads.
#[must_use]
pub fn now(app: &AppHandle) -> serde_json::Value {
    let update = followed(app).map_or(DesktopUpdate::None, |followed| followed.update());

    serde_json::to_value(update).unwrap_or(serde_json::Value::Null)
}

/// Whether this build updates itself, which an installed one with a feed does.
#[must_use]
pub fn can_update(app: &AppHandle) -> bool {
    followed(app).is_some()
}

/// Looks for a release straight away, as somebody asked from the menu or the tray.
pub fn check_now(app: &AppHandle) {
    if let Some(followed) = followed(app) {
        followed.check_now();
    }
}

/// Downloads the update that is available, and restarts into it once it is on disk.
#[tauri::command]
#[allow(
    clippy::needless_pass_by_value,
    reason = "Tauri hands a command what it was asked with by value"
)]
pub fn update_download(app: AppHandle) {
    if let Some(followed) = followed(&app) {
        followed.download();
    }
}

/// Puts up the installing window over the main one, takes the main one away, and leaves word for
/// the next launch, before the restart into a release.
async fn before_installing(app: AppHandle, log: Arc<UpdateLog>, version: String) {
    let main = the_main_window(&app);

    let opening = open_the_update_window(&app, Step::Installing, &version, main.as_ref());
    let _ = tokio::time::timeout(LONGEST_TO_OPEN, opening).await;

    if let Some(main) = main {
        let _ = main.hide();
    }

    if let Err(error) = InstallMark::in_folder(&crate::paths::user_data()).leave(&version) {
        log.write(&format!("Could not leave the install mark: {error}"));
    }

    tokio::time::sleep(SHOW_THE_UPDATE_FOR).await;
}

/// Shows the finishing window over the main screen while the app comes up after an install, and
/// takes it away once the main window is showing.
async fn finish(app: AppHandle, version: String) {
    let opening = open_the_update_window(&app, Step::Finishing, &version, None);
    let Ok(Some(finishing)) = tokio::time::timeout(LONGEST_TO_OPEN, opening).await else {
        return;
    };

    tokio::time::sleep(SHOW_THE_UPDATE_FOR).await;

    let mut waited = Duration::ZERO;

    while waited < LONGEST_FINISH
        && !the_main_window(&app).is_some_and(|main| main.is_visible().unwrap_or(false))
    {
        tokio::time::sleep(LOOK_FOR_THE_WINDOW_EVERY).await;
        waited += LOOK_FOR_THE_WINDOW_EVERY;
    }

    let _ = finishing.close();
}

/// Starts following the updates, in an installed build whose updater can be set up.
fn start_following(app: &tauri::App, log: &Arc<UpdateLog>) -> Option<Arc<Followed<TauriUpdater>>> {
    if cfg!(debug_assertions) {
        return None;
    }

    if let Err(error) = app
        .handle()
        .plugin(tauri_plugin_updater::Builder::new().build())
    {
        log.write(&format!("Not following updates: {error}"));

        return None;
    }

    let about = crate::about::about(app.handle());
    let asked = std::env::var("VALENCE_UPDATE_FEED_URL").ok();
    let feed = feed::the_feed(asked.as_deref(), about.is_a_dev_build)?;
    let handle = app.handle().clone();
    let announcing = app.handle().clone();
    let installing = app.handle().clone();
    let installing_log = Arc::clone(log);
    let logging = Arc::clone(log);

    log.write(&format!("Following updates at {feed}"));

    Some(follow_the_updates(
        TauriUpdater::new(handle, feed),
        tauri::async_runtime::handle().inner().clone(),
        Needs {
            every: CHECK_EVERY,
            on_change: Box::new(move |update| {
                let _ = announcing.emit(UPDATE_CHANGED, update);
            }),
            before_installing: Box::new(move |version| {
                before_installing(installing.clone(), Arc::clone(&installing_log), version).boxed()
            }),
            log: Box::new(move |line| logging.write(line)),
        },
    ))
}

/// Gets this part of the app ready, before the window opens: picks up word of an install that has
/// just happened, and starts following the updates in an installed build.
///
/// # Errors
///
/// When Tauri will not take the part that stops looking as the app quits; a build that cannot
/// follow its updates goes on without them.
pub fn setup(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let log = Arc::new(UpdateLog::in_folder(&crate::paths::user_data()));
    let running = app.package_info().version.to_string();

    if let Some(installed) = InstallMark::in_folder(&crate::paths::user_data()).take() {
        if installed == running {
            log.write(&format!("Started on {installed} after installing it"));
            tauri::async_runtime::spawn(finish(app.handle().clone(), installed));
        } else {
            log.write(&format!(
                "Started on {running} after installing {installed}, which did not take"
            ));
        }
    }

    let followed = start_following(app, &log);

    if let Some(followed) = followed.as_ref().map(Arc::clone) {
        app.handle().plugin(
            tauri::plugin::Builder::<tauri::Wry>::new("valence-updates")
                .on_event(move |_, event| {
                    if matches!(event, tauri::RunEvent::Exit) {
                        followed.stop();
                    }
                })
                .build(),
        )?;
    }

    app.manage(Updates(followed));

    Ok(())
}
