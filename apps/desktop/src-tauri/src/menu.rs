//! The application menu and the window's own menu.
//!
//! The menu's one unusual item is the way back to choosing a server, which has to be a menu item
//! rather than a button on a screen: once the window shows the server's own pages there is no
//! screen of ours left to put it on. It is under File on every platform, and on the application
//! menu as well on a Mac. Checking for updates sits under About on a Mac, and only in a build that
//! updates itself. The developer tools are offered only in a build being worked on, or one started
//! asking for them.
//!
//! Windows and Linux have no menu bar to show, since the window draws its own bar, so there is no
//! menu there at all. The page hears the menu's shortcuts instead and asks for each item by
//! pressing it here, as a menu would, along with the window's own minimise, close and quit. A right click raises no menu of the window's own:
//! left alone, it raises a browser's menu of reload and inspect, which is a browser showing through
//! rather than an application.

use std::sync::{Mutex, PoisonError};
use tauri::menu::{
    AboutMetadata, Menu, MenuBuilder, MenuEvent, MenuItemBuilder, Submenu, SubmenuBuilder,
};
use tauri::{AppHandle, Manager, WebviewWindow, Wry};

/// Where Valence is made.
const VALENCE_REPOSITORY_URL: &str = "https://github.com/ValenceOSS/Valence";

/// The item that changes server.
const CHANGE_SERVER: &str = "valence-change-server";

/// The item that looks for a release.
pub const CHECK_FOR_UPDATES: &str = "valence-check-for-updates";

/// The item that reloads the page.
const RELOAD: &str = "valence-reload";

/// The item that reloads the page from scratch.
const FORCE_RELOAD: &str = "valence-force-reload";

/// The item that opens or closes the developer tools.
const TOGGLE_DEV_TOOLS: &str = "valence-toggle-dev-tools";

/// The item that puts the zoom back.
const RESET_ZOOM: &str = "valence-reset-zoom";

/// The item that zooms in.
const ZOOM_IN: &str = "valence-zoom-in";

/// The item that zooms out.
const ZOOM_OUT: &str = "valence-zoom-out";

/// The item that fills the screen, or stops filling it.
const TOGGLE_FULL_SCREEN: &str = "valence-toggle-full-screen";

/// The item that opens Valence's page on the web.
const VALENCE_ON_THE_WEB: &str = "valence-on-the-web";

/// The window menu's item that minimises the window.
const MINIMISE: &str = "valence-minimise";

/// The window menu's item that closes the window.
const CLOSE_WINDOW: &str = "valence-close-window";

/// The item that quits.
const QUIT: &str = "valence-quit";

/// How far one step of zoom goes, as a browser counts its zoom level.
const ZOOM_STEP: f64 = 0.5;

/// How far the page is zoomed, as a browser's zoom level: nought is actual size.
#[derive(Default)]
struct Zoom(Mutex<f64>);

/// The zoom factor for a browser's zoom level, each level twenty per cent more than the last.
#[must_use]
pub fn zoom_factor(level: f64) -> f64 {
    1.2_f64.powf(level)
}

/// Whether this is a Mac, which keeps its menu at the top of the screen.
const fn is_mac() -> bool {
    cfg!(target_os = "macos")
}

/// The window being used, or the first there is.
fn the_window(app: &AppHandle) -> Option<WebviewWindow> {
    let windows = app.webview_windows();

    windows
        .values()
        .find(|window| window.is_focused().unwrap_or(false))
        .or_else(|| windows.values().next())
        .cloned()
}

/// Says the words kept under a key.
fn words(key: &str) -> String {
    crate::say::say(key, &[])
}

/// The application menu on a Mac, named Valence.
fn the_valence_menu(app: &AppHandle, can_update: bool) -> tauri::Result<Submenu<Wry>> {
    let mut valence =
        SubmenuBuilder::new(app, words("common.valence")).about(Some(AboutMetadata::default()));

    if can_update {
        valence = valence.item(
            &MenuItemBuilder::with_id(CHECK_FOR_UPDATES, words("common.checkForUpdates"))
                .build(app)?,
        );
    }

    valence
        .separator()
        .item(&the_change_server_item(app)?)
        .separator()
        .services()
        .separator()
        .hide()
        .hide_others()
        .show_all()
        .separator()
        .quit()
        .build()
}

/// The item that changes server, with its shortcut.
fn the_change_server_item(app: &AppHandle) -> tauri::Result<tauri::menu::MenuItem<Wry>> {
    MenuItemBuilder::with_id(CHANGE_SERVER, words("common.changeServer"))
        .accelerator(words("desktop.main.theApplicationMenu.cmdOrCtrlShiftS"))
        .build(app)
}

/// The View menu: reloading, the developer tools where offered, zoom, and full screen.
fn the_view_menu(app: &AppHandle) -> tauri::Result<Submenu<Wry>> {
    let item = |id: &str, key: &str, accelerator: &str| {
        MenuItemBuilder::with_id(id, words(key))
            .accelerator(accelerator)
            .build(app)
    };
    let mut view = SubmenuBuilder::new(app, words("common.view"))
        .item(&item(
            RELOAD,
            "desktop.main.theApplicationMenu.reload",
            "CmdOrCtrl+R",
        )?)
        .item(&item(
            FORCE_RELOAD,
            "desktop.main.theApplicationMenu.forceReload",
            "CmdOrCtrl+Shift+R",
        )?);

    if crate::debugging::may_be_inspected() {
        view = view.item(&item(
            TOGGLE_DEV_TOOLS,
            "desktop.main.theApplicationMenu.toggleDeveloperTools",
            if is_mac() {
                "Alt+Cmd+I"
            } else {
                "Ctrl+Shift+I"
            },
        )?);
    }

    view.separator()
        .item(&item(
            RESET_ZOOM,
            "desktop.main.theApplicationMenu.actualSize",
            "CmdOrCtrl+0",
        )?)
        .item(&item(
            ZOOM_IN,
            "desktop.main.theApplicationMenu.zoomIn",
            "CmdOrCtrl+Plus",
        )?)
        .item(&item(
            ZOOM_OUT,
            "desktop.main.theApplicationMenu.zoomOut",
            "CmdOrCtrl+-",
        )?)
        .separator()
        .item(&item(
            TOGGLE_FULL_SCREEN,
            "desktop.main.theApplicationMenu.toggleFullScreen",
            if is_mac() { "Ctrl+Cmd+F" } else { "F11" },
        )?)
        .build()
}

/// Builds the menu.
fn the_application_menu(app: &AppHandle, can_update: bool) -> tauri::Result<Menu<Wry>> {
    let mut file = SubmenuBuilder::new(app, words("desktop.main.theApplicationMenu.file"))
        .item(&the_change_server_item(app)?);

    if !is_mac() {
        file = file.separator().quit();
    }

    let edit = SubmenuBuilder::new(app, words("common.edit"))
        .undo()
        .redo()
        .separator()
        .cut()
        .copy()
        .paste()
        .select_all()
        .build()?;
    let mut window =
        SubmenuBuilder::new(app, words("desktop.main.theApplicationMenu.window")).minimize();

    window = if is_mac() {
        window.maximize().separator().bring_all_to_front()
    } else {
        window.close_window()
    };

    let help = SubmenuBuilder::new(app, words("common.help"))
        .item(
            &MenuItemBuilder::with_id(
                VALENCE_ON_THE_WEB,
                words("desktop.main.theApplicationMenu.valenceOnTheWeb"),
            )
            .build(app)?,
        )
        .build()?;
    let mut menu = MenuBuilder::new(app);

    if is_mac() {
        menu = menu.item(&the_valence_menu(app, can_update)?);
    }

    menu.item(&file.build()?)
        .item(&edit)
        .item(&the_view_menu(app)?)
        .item(&window.build()?)
        .item(&help)
        .build()
}

/// Moves the zoom by some levels, or back to actual size.
fn zoom(app: &AppHandle, by: Option<f64>) {
    let Some(zoom) = app.try_state::<Zoom>() else {
        return;
    };
    let level = {
        let mut level = zoom.0.lock().unwrap_or_else(PoisonError::into_inner);

        *level = by.map_or(0.0, |by| *level + by);
        *level
    };

    for window in app.webview_windows().values() {
        let _ = window.set_zoom(zoom_factor(level));
    }
}

/// The item a shortcut the page heard stands for, by the shortcut's name, or none for a name that
/// is not one.
#[must_use]
pub fn item_for(shortcut: &str) -> Option<&'static str> {
    match shortcut {
        "change-server" => Some(CHANGE_SERVER),
        "reload" => Some(RELOAD),
        "force-reload" => Some(FORCE_RELOAD),
        "toggle-dev-tools" => Some(TOGGLE_DEV_TOOLS),
        "actual-size" => Some(RESET_ZOOM),
        "zoom-in" => Some(ZOOM_IN),
        "zoom-out" => Some(ZOOM_OUT),
        "toggle-full-screen" => Some(TOGGLE_FULL_SCREEN),
        "minimise" => Some(MINIMISE),
        "close-window" => Some(CLOSE_WINDOW),
        "quit" => Some(QUIT),
        _ => None,
    }
}

/// Does what the item with `id`, of the menu or the tray, says.
fn act(app: &AppHandle, id: &str) {
    let window = the_window(app);

    match id {
        CHANGE_SERVER => crate::window::change_server(app.clone()),
        CHECK_FOR_UPDATES => crate::updates::check_now(app),
        RELOAD | FORCE_RELOAD => {
            if let Some(window) = window {
                let _ = window.reload();
            }
        }
        TOGGLE_DEV_TOOLS => {
            if let Some(window) = window.filter(|_| crate::debugging::may_be_inspected()) {
                if window.is_devtools_open() {
                    window.close_devtools();
                } else {
                    window.open_devtools();
                }
            }
        }
        RESET_ZOOM => zoom(app, None),
        ZOOM_IN => zoom(app, Some(ZOOM_STEP)),
        ZOOM_OUT => zoom(app, Some(-ZOOM_STEP)),
        TOGGLE_FULL_SCREEN => {
            if let Some(window) = window {
                let _ = window.set_fullscreen(!window.is_fullscreen().unwrap_or(false));
            }
        }
        MINIMISE => {
            if let Some(window) = window {
                let _ = window.minimize();
            }
        }
        CLOSE_WINDOW => {
            if let Some(window) = window {
                let _ = window.close();
            }
        }
        QUIT => app.exit(0),
        VALENCE_ON_THE_WEB => {
            let _ = tauri_plugin_opener::open_url(VALENCE_REPOSITORY_URL, None::<&str>);
        }
        _ => {}
    }
}

/// Does what an item of the menu or the tray says.
fn chosen(app: &AppHandle, event: &MenuEvent) {
    act(app, event.id().as_ref());
}

/// Does what a shortcut the page heard asks for, as the menu's item for it would: the page hears
/// the shortcuts where there is no menu bar to hear them.
#[tauri::command]
#[allow(
    clippy::needless_pass_by_value,
    reason = "Tauri hands a command what it was asked with by value"
)]
pub fn press_a_shortcut(app: AppHandle, shortcut: String) {
    if let Some(item) = item_for(&shortcut) {
        act(&app, item);
    }
}

/// Gets this part of the app ready, before the window opens: sets the menu on macOS, which keeps it
/// at the top of the screen, and answers it. Elsewhere the window is frameless and draws its own
/// bar, so there is no menu bar, as there was none in the Electron app.
///
/// # Errors
///
/// When the menu cannot be built.
pub fn setup(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let handle = app.handle();

    app.manage(Zoom::default());

    if is_mac() {
        handle.set_menu(the_application_menu(
            handle,
            crate::updates::can_update(handle),
        )?)?;
    }

    handle.on_menu_event(|app, event| chosen(app, &event));

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{item_for, zoom_factor};

    #[test]
    fn knows_the_item_for_every_shortcut_and_nothing_else() {
        for (shortcut, item) in [
            ("change-server", "valence-change-server"),
            ("reload", "valence-reload"),
            ("force-reload", "valence-force-reload"),
            ("toggle-dev-tools", "valence-toggle-dev-tools"),
            ("actual-size", "valence-reset-zoom"),
            ("zoom-in", "valence-zoom-in"),
            ("zoom-out", "valence-zoom-out"),
            ("toggle-full-screen", "valence-toggle-full-screen"),
            ("minimise", "valence-minimise"),
            ("close-window", "valence-close-window"),
            ("quit", "valence-quit"),
        ] {
            assert_eq!(item_for(shortcut), Some(item));
        }

        assert_eq!(item_for("valence-on-the-web"), None);
        assert_eq!(item_for("check-for-updates"), None);
        assert_eq!(item_for(""), None);
    }

    #[test]
    fn zooms_as_a_browser_does() {
        assert!((zoom_factor(0.0) - 1.0).abs() < f64::EPSILON);
        assert!((zoom_factor(1.0) - 1.2).abs() < 1e-9);
        assert!((zoom_factor(-0.5) - 1.0 / 1.2_f64.sqrt()).abs() < 1e-9);
    }
}
