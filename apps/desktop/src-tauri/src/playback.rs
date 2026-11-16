//! What each system webview is told as a window is made, so the page's player runs at full
//! strength in it: the media element playing whatever the webview's own decoders take, and the
//! player's own engine decoding with `WebCodecs` and drawing with `WebGPU` wherever the webview has
//! both. What the page then claims to the server it asks of the webview itself, so a setting here
//! changes what is direct played only by changing what the webview really decodes.
//!
//! - **Linux, `WebKitGTK`.** Hardware acceleration always, `WebGL`, media, Media Source, media
//!   capabilities and fullscreen on, and media played without a gesture, beside the autoplay
//!   policy wry already sets. The runtime features the player uses are switched on where the
//!   installed version has them ready for general use, and never where it calls them a preview or
//!   unfinished: `WebGPU` is unfinished in 2.52 and has no backend outside Apple's, so it stays off
//!   and the engine stands aside for the media element and the server. The window goes full screen
//!   with the page's element through Tauri, so it knows it is, and the page's controls with it.
//!   The application is named, which is what the desktop's player shows. The DMA-BUF renderer is
//!   turned off only under NVIDIA's own driver, where it draws a blank window (tauri-apps/tauri
//!   issue 9394), and never over what the person set themselves. Codecs come from `GStreamer`,
//!   which the packages bring; the media keys and the desktop's player come from its own MPRIS.
//! - **macOS, `WKWebView`.** Wry already turns on element fullscreen, picture in picture, and media
//!   played without a gesture, and `AirPlay` is on by default. `WebCodecs` and `WebGPU` come with
//!   the system's `WebKit` and are not switched on through private interfaces where it leaves them
//!   off. Now Playing and the media keys come from `WebKit` itself.
//! - **Windows, `WebView2`.** Edge's Chromium has `WebGPU`, `WebCodecs` and hardware decoding on by
//!   default, and its platform decoders take HEVC where the machine does. Wry starts it with
//!   autoplay allowed and Tauri makes the window full screen with the page's element, so it keeps
//!   Tauri's arguments. The media keys and the system's media overlay come from Chromium itself.

use tauri::WebviewWindow;

/// The variable that turns `WebKitGTK`'s DMA-BUF renderer off.
#[cfg_attr(
    not(target_os = "linux"),
    allow(dead_code, reason = "only Linux's webview has this renderer")
)]
const DMABUF_VARIABLE: &str = "WEBKIT_DISABLE_DMABUF_RENDERER";

/// Where NVIDIA's own driver says it is loaded, which the open driver never writes.
#[cfg_attr(
    not(target_os = "linux"),
    allow(dead_code, reason = "only Linux's webview has this renderer")
)]
const NVIDIA_DRIVER: &str = "/proc/driver/nvidia/version";

/// The `WebKitGTK` runtime features the player relies on.
#[cfg_attr(
    not(target_os = "linux"),
    allow(dead_code, reason = "only Linux's webview lists its features this way")
)]
const FEATURES_THE_PLAYER_USES: [&str; 10] = [
    "WebCodecsVideo",
    "WebCodecsAudio",
    "WebCodecsHEVC",
    "WebCodecsAV1",
    "MediaSource",
    "MediaCapabilities",
    "MediaSession",
    "RequestVideoFrameCallback",
    "WebGPU",
    "WebGPUHDR",
];

/// How ready `WebKitGTK` says one of its runtime features is, in the order `WebKitFeatureStatus`
/// numbers them.
#[cfg_attr(
    not(target_os = "linux"),
    allow(dead_code, reason = "only Linux's webview lists its features this way")
)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum Readiness {
    /// The embedding app's to decide, as a setting is.
    Embedder,
    /// Still being written.
    Unstable,
    /// For working on `WebKit` itself.
    Internal,
    /// For web developers.
    Developer,
    /// Complete enough to test, not to ship.
    Testable,
    /// For a technology preview.
    Preview,
    /// Ready for general use.
    Stable,
    /// In general use.
    Mature,
    /// A number this version does not know.
    Unknown,
}

#[cfg_attr(
    not(target_os = "linux"),
    allow(dead_code, reason = "only Linux's webview lists its features this way")
)]
impl Readiness {
    /// The readiness `WebKitGTK` numbers `status`.
    const fn of(status: i32) -> Self {
        match status {
            0 => Self::Embedder,
            1 => Self::Unstable,
            2 => Self::Internal,
            3 => Self::Developer,
            4 => Self::Testable,
            5 => Self::Preview,
            6 => Self::Stable,
            7 => Self::Mature,
            _ => Self::Unknown,
        }
    }
}

/// Whether the runtime feature named `identifier` is switched on for the player: one it uses, which
/// the webview calls the app's to decide or ready for general use.
#[cfg_attr(
    not(target_os = "linux"),
    allow(dead_code, reason = "only Linux's webview lists its features this way")
)]
fn switches_on(identifier: &str, readiness: Readiness) -> bool {
    FEATURES_THE_PLAYER_USES.contains(&identifier)
        && matches!(
            readiness,
            Readiness::Embedder | Readiness::Stable | Readiness::Mature
        )
}

/// Whether `WebKitGTK`'s DMA-BUF renderer is turned off: under NVIDIA's own driver, unless the
/// person already said either way.
#[cfg_attr(
    not(target_os = "linux"),
    allow(dead_code, reason = "only Linux's webview has this renderer")
)]
const fn turns_dmabuf_off(is_nvidias_driver_loaded: bool, is_already_said: bool) -> bool {
    is_nvidias_driver_loaded && !is_already_said
}

/// Sets what the webview reads from the environment as it starts, so it has to run before any
/// window is made.
pub fn before_any_webview() {
    #[cfg(target_os = "linux")]
    if turns_dmabuf_off(
        std::path::Path::new(NVIDIA_DRIVER).exists(),
        std::env::var_os(DMABUF_VARIABLE).is_some(),
    ) {
        std::env::set_var(DMABUF_VARIABLE, "1");
    }

    #[cfg(target_os = "linux")]
    webkit2gtk::glib::set_application_name(&crate::say::say("common.valence", &[]));
}

/// Tells the webview of a window just made what the player needs of it.
pub fn tune(window: &WebviewWindow) {
    #[cfg(target_os = "linux")]
    #[cfg(target_os = "linux")]
    {
        let following = window.clone();

        if let Err(error) =
            window.with_webview(move |webview| linux::tune(&webview.inner(), following))
        {
            eprintln!("Valence could not set its webview up for playback: {error}");
        }
    }

    #[cfg(not(target_os = "linux"))]
    let _ = window;
}

#[cfg(target_os = "linux")]
mod linux {
    #![allow(
        unsafe_code,
        reason = "WebKitGTK's runtime features are reached only through its C interface"
    )]

    use std::ffi::{c_char, c_int, c_void, CStr};

    use tauri::WebviewWindow;
    use webkit2gtk::glib::translate::ToGlibPtr;
    use webkit2gtk::{HardwareAccelerationPolicy, SettingsExt, WebViewExt};

    use super::{switches_on, Readiness};

    /// `WebKitGTK`'s runtime feature interface, from 2.42, looked up as the app runs so an older
    /// `WebKitGTK` still starts it, each feature borrowed from the list that holds it and named by
    /// a C string it owns.
    struct Features {
        all: unsafe extern "C" fn() -> *mut c_void,
        length: unsafe extern "C" fn(*mut c_void) -> usize,
        at: unsafe extern "C" fn(*mut c_void, usize) -> *mut c_void,
        identifier: unsafe extern "C" fn(*mut c_void) -> *const c_char,
        status: unsafe extern "C" fn(*mut c_void) -> c_int,
        set_enabled: unsafe extern "C" fn(*mut c_void, *mut c_void, c_int),
        release: unsafe extern "C" fn(*mut c_void),
    }

    /// The function named `name` in a library already loaded, as the function type `T`, which
    /// must be the type the library declares it with: a pointer in size, or nothing is found.
    fn symbol<T: Copy>(name: &CStr) -> Option<T> {
        if std::mem::size_of::<T>() != std::mem::size_of::<*mut c_void>() {
            return None;
        }

        // SAFETY: `dlsym` reads a C string, and finds a function of the size and type `T` names.
        unsafe {
            let found = libc::dlsym(libc::RTLD_DEFAULT, name.as_ptr());

            (!found.is_null()).then(|| std::mem::transmute_copy::<*mut c_void, T>(&found))
        }
    }

    impl Features {
        /// The interface, where this `WebKitGTK` has it.
        fn find() -> Option<Self> {
            Some(Self {
                all: symbol(c"webkit_settings_get_all_features")?,
                length: symbol(c"webkit_feature_list_get_length")?,
                at: symbol(c"webkit_feature_list_get")?,
                identifier: symbol(c"webkit_feature_get_identifier")?,
                status: symbol(c"webkit_feature_get_status")?,
                set_enabled: symbol(c"webkit_settings_set_feature_enabled")?,
                release: symbol(c"webkit_feature_list_unref")?,
            })
        }
    }

    /// Switches on the runtime features the player uses, where `settings`' version has them ready.
    fn switch_on_what_the_player_uses(settings: &webkit2gtk::Settings) {
        let Some(features) = Features::find() else {
            return;
        };
        let raw: *mut webkit2gtk::ffi::WebKitSettings = settings.to_glib_none().0;

        // SAFETY: called as WebKitGTK declares them, on its thread, the list held till released.
        unsafe {
            let list = (features.all)();

            if list.is_null() {
                return;
            }

            for index in 0..(features.length)(list) {
                let feature = (features.at)(list, index);

                if feature.is_null() {
                    continue;
                }

                let identifier = (features.identifier)(feature);

                if identifier.is_null() {
                    continue;
                }

                let readiness = Readiness::of((features.status)(feature));

                if switches_on(&CStr::from_ptr(identifier).to_string_lossy(), readiness) {
                    (features.set_enabled)(raw.cast(), feature, 1);
                }
            }

            (features.release)(list);
        }
    }

    /// Sets `webview` up for the player, and makes `window` full screen with the page's element so
    /// the window knows it is, as it does when it is made full screen itself.
    pub fn tune(webview: &webkit2gtk::WebView, window: WebviewWindow) {
        let leaving = window.clone();

        webview.connect_enter_fullscreen(move |_| {
            let _ = window.set_fullscreen(true);
            false
        });
        webview.connect_leave_fullscreen(move |_| {
            let _ = leaving.set_fullscreen(false);
            false
        });

        let Some(settings) = WebViewExt::settings(webview) else {
            return;
        };

        settings.set_hardware_acceleration_policy(HardwareAccelerationPolicy::Always);
        settings.set_enable_webgl(true);
        settings.set_enable_media(true);
        settings.set_enable_mediasource(true);
        settings.set_enable_media_capabilities(true);
        settings.set_enable_fullscreen(true);
        settings.set_media_playback_requires_user_gesture(false);
        switch_on_what_the_player_uses(&settings);
    }
}

#[cfg(test)]
mod tests {
    use super::{switches_on, turns_dmabuf_off, Readiness};

    #[test]
    fn reads_each_readiness_webkit_numbers() {
        assert_eq!(Readiness::of(0), Readiness::Embedder);
        assert_eq!(Readiness::of(1), Readiness::Unstable);
        assert_eq!(Readiness::of(4), Readiness::Testable);
        assert_eq!(Readiness::of(5), Readiness::Preview);
        assert_eq!(Readiness::of(6), Readiness::Stable);
        assert_eq!(Readiness::of(7), Readiness::Mature);
        assert_eq!(Readiness::of(8), Readiness::Unknown);
        assert_eq!(Readiness::of(-1), Readiness::Unknown);
    }

    #[test]
    fn switches_on_what_the_player_uses_once_it_is_ready() {
        assert!(switches_on("WebCodecsVideo", Readiness::Stable));
        assert!(switches_on("WebCodecsHEVC", Readiness::Mature));
        assert!(switches_on("MediaSource", Readiness::Embedder));
        assert!(switches_on("WebGPU", Readiness::Stable));
    }

    #[test]
    fn leaves_off_what_is_still_a_preview_or_unfinished() {
        assert!(!switches_on("WebGPU", Readiness::Unstable));
        assert!(!switches_on("WebGPUHDR", Readiness::Preview));
        assert!(!switches_on("WebCodecsAV1", Readiness::Testable));
        assert!(!switches_on("MediaSession", Readiness::Internal));
        assert!(!switches_on("MediaSession", Readiness::Developer));
        assert!(!switches_on("MediaSession", Readiness::Unknown));
    }

    #[test]
    fn leaves_alone_what_the_player_does_not_use() {
        assert!(!switches_on("SiteIsolation", Readiness::Stable));
        assert!(!switches_on("", Readiness::Mature));
    }

    #[test]
    fn turns_the_dmabuf_renderer_off_only_under_nvidias_own_driver() {
        assert!(turns_dmabuf_off(true, false));
        assert!(!turns_dmabuf_off(false, false));
    }

    #[test]
    fn leaves_the_dmabuf_renderer_as_the_person_set_it() {
        assert!(!turns_dmabuf_off(true, true));
        assert!(!turns_dmabuf_off(false, true));
    }
}
