//! Word left for the next launch that this one quit to install an update.
//!
//! The process that downloads an update is not the one that finds out whether it installed: the
//! installer runs between the two with neither of them alive. A file beside this app's others is
//! the only thing that crosses that gap, so the version quitting writes down what it is installing
//! and the version starting reads it, once, and removes it.

use std::path::{Path, PathBuf};

/// The mark, in the folder this app keeps its files in.
pub struct InstallMark {
    file: PathBuf,
}

impl InstallMark {
    /// The mark in a folder.
    #[must_use]
    pub fn in_folder(folder: &Path) -> Self {
        Self {
            file: folder.join("installing"),
        }
    }

    /// Leaves the version being installed, before quitting for the installer.
    ///
    /// # Errors
    ///
    /// When the file cannot be written.
    pub fn leave(&self, version: &str) -> std::io::Result<()> {
        std::fs::write(&self.file, version)
    }

    /// Takes the version that was being installed, once, on the way up.
    #[must_use]
    pub fn take(&self) -> Option<String> {
        let version = std::fs::read_to_string(&self.file).ok()?;
        let _ = std::fs::remove_file(&self.file);
        let version = version.trim();

        (!version.is_empty()).then(|| version.to_owned())
    }
}

#[cfg(test)]
mod tests {
    use super::InstallMark;

    fn a_folder() -> tempfile::TempDir {
        tempfile::tempdir().unwrap_or_else(|error| panic!("no folder: {error}"))
    }

    #[test]
    fn carries_the_version_being_installed_across_to_the_next_launch() {
        let folder = a_folder();
        let left = InstallMark::in_folder(folder.path()).leave("1.5.0");

        assert!(left.is_ok());
        assert_eq!(
            std::fs::read_to_string(folder.path().join("installing")).ok(),
            Some("1.5.0".to_owned())
        );
        assert_eq!(
            InstallMark::in_folder(folder.path()).take(),
            Some("1.5.0".to_owned())
        );
    }

    #[test]
    fn is_taken_once_so_a_later_launch_is_not_told_about_an_install_already_seen() {
        let folder = a_folder();
        let mark = InstallMark::in_folder(folder.path());

        let _ = mark.leave("1.5.0");
        let _ = mark.take();

        assert_eq!(mark.take(), None);
    }

    #[test]
    fn finds_nothing_where_nothing_was_installed() {
        assert_eq!(InstallMark::in_folder(a_folder().path()).take(), None);
    }
}
