//! Where this app keeps its own files.
//!
//! Every folder here is the one the Electron app used, so what somebody already has on this
//! computer — their downloads, their preferences, the update log — is found where it was left.

use std::path::{Path, PathBuf};

const USER_DATA: &str = "Valence";

const CONF_PROJECT: &str = "valence-nodejs";

const HELD: &str = "held";

/// The folder this app keeps everything of its own in: `Valence` in the system's folder for
/// application data, the folder the Electron app pinned its user data to.
#[must_use]
pub fn user_data() -> PathBuf {
    dirs::config_dir()
        .or_else(dirs::home_dir)
        .unwrap_or_else(std::env::temp_dir)
        .join(USER_DATA)
}

/// The folder kept films, episodes and listening files are in.
#[must_use]
pub fn held_folder() -> PathBuf {
    user_data().join(HELD)
}

/// The folder the Electron app's settings files are in, where `preferences.json` and `held.json`
/// are: the folder the `conf` library chose for the project `valence`.
#[must_use]
pub fn conf_folder() -> PathBuf {
    conf_folder_under(
        dirs::config_dir()
            .or_else(dirs::home_dir)
            .unwrap_or_else(std::env::temp_dir),
        dirs::preference_dir(),
    )
}

/// Where `conf` keeps a project's files, given the system's folders for configuration and for
/// preferences.
fn conf_folder_under(config: PathBuf, preferences: Option<PathBuf>) -> PathBuf {
    if cfg!(target_os = "macos") {
        preferences.unwrap_or(config).join(CONF_PROJECT)
    } else if cfg!(windows) {
        config.join(CONF_PROJECT).join("Config")
    } else {
        config.join(CONF_PROJECT)
    }
}

/// The file one kept film is in.
#[must_use]
pub fn file_kept(folder: &Path, download_id: &str) -> PathBuf {
    folder.join(format!("{download_id}.mp4"))
}

/// The poster kept beside one film.
#[must_use]
pub fn poster_kept(folder: &Path, download_id: &str) -> PathBuf {
    folder.join(format!("{download_id}.jpg"))
}

/// The folder of scrubbing thumbnails kept beside one film.
#[must_use]
pub fn trickplay_kept(folder: &Path, download_id: &str) -> PathBuf {
    folder.join(format!("{download_id}.trickplay"))
}

/// The file one kept song, audiobook track or cover is in.
#[must_use]
pub fn listening_kept(folder: &Path, name: &str) -> PathBuf {
    folder.join("listening").join(name)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn user_data_is_the_valence_folder() {
        assert!(user_data().ends_with("Valence"));
    }

    #[test]
    fn held_files_are_under_user_data() {
        assert_eq!(held_folder(), user_data().join("held"));
    }

    #[test]
    fn conf_keeps_its_files_where_electron_did() {
        let found = conf_folder_under(
            PathBuf::from("/config"),
            Some(PathBuf::from("/preferences")),
        );

        if cfg!(target_os = "macos") {
            assert_eq!(found, PathBuf::from("/preferences/valence-nodejs"));
        } else if cfg!(windows) {
            assert_eq!(found, PathBuf::from("/config/valence-nodejs/Config"));
        } else {
            assert_eq!(found, PathBuf::from("/config/valence-nodejs"));
        }
    }

    #[test]
    fn kept_files_are_named_by_their_download() {
        let folder = Path::new("/held");

        assert_eq!(file_kept(folder, "a"), PathBuf::from("/held/a.mp4"));
        assert_eq!(poster_kept(folder, "a"), PathBuf::from("/held/a.jpg"));
        assert_eq!(
            trickplay_kept(folder, "a"),
            PathBuf::from("/held/a.trickplay")
        );
        assert_eq!(
            listening_kept(folder, "b.mp3"),
            PathBuf::from("/held/listening/b.mp3")
        );
    }
}
