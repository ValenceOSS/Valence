//! Where a path the server names lies on this machine.
//!
//! The server and the requests service name files as their containers see
//! them, `/media/…` and `/downloads/…`. A transcoder in the same container, or
//! one beside it with the same mounts, sees the same paths and needs nothing
//! from here. A transcoder running natively on the host, which is how a Mac
//! reaches `VideoToolbox` (VAL-338), sees the folders those mounts came from
//! instead, and has to be told which is which.
//!
//! The translation happens as a request is read, on every field that names a
//! file, so no route can forget it. With no map set, a path passes through as
//! it came.

use std::path::{Component, Path, PathBuf};
use std::sync::OnceLock;

use serde::{Deserialize, Deserializer};

/// The setting a map is read from.
pub const VARIABLE: &str = "VALENCE_PATH_MAP";

/// Folders as the server names them, each beside where it lies here.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PathMap {
    folders: Vec<(String, PathBuf)>,
}

impl PathMap {
    /// Reads `container=host` pairs separated by `;`.
    ///
    /// `;` and `=` rather than Docker's `host:container`, because a colon is
    /// part of every Windows path and would split `D:\Media` in two.
    ///
    /// # Errors
    ///
    /// Says which pair it could not read, and why: one without an `=`, one
    /// whose container side is not absolute, or one with nothing on its host
    /// side. A map with a mistake in it is refused whole rather than used in
    /// part, because the half that was dropped would show up as files that
    /// will not play rather than as the setting that caused it.
    pub fn parse(value: &str) -> Result<Option<Self>, String> {
        let mut folders = Vec::new();

        for pair in value
            .split(';')
            .map(str::trim)
            .filter(|pair| !pair.is_empty())
        {
            let Some((container, host)) = pair.split_once('=') else {
                return Err(format!(
                    "{VARIABLE} pair \"{pair}\" has no =; write it as /media=/Volumes/Media"
                ));
            };

            if !container.starts_with('/') {
                return Err(format!(
                    "{VARIABLE} pair \"{pair}\" must start with the path the container sees, such as /media"
                ));
            }

            if host.is_empty() {
                return Err(format!(
                    "{VARIABLE} pair \"{pair}\" says nothing about where {container} is on this machine"
                ));
            }

            let container = match container.trim_end_matches('/') {
                "" => "/",
                trimmed => trimmed,
            };

            folders.push((container.to_owned(), PathBuf::from(host)));
        }

        if folders.is_empty() {
            return Ok(None);
        }

        folders.sort_by_key(|(container, _)| std::cmp::Reverse(container.len()));

        Ok(Some(Self { folders }))
    }

    /// Each folder as the server names it, and where it lies here, as one line for a log.
    #[must_use]
    pub fn describe(&self) -> String {
        self.folders
            .iter()
            .map(|(container, host)| format!("{container} is {}", host.display()))
            .collect::<Vec<_>>()
            .join(", ")
    }

    /// Where a path the server named lies on this machine.
    ///
    /// The longest folder that holds the path wins, so `/media/films` mapped on
    /// its own is preferred to `/media` mapped above it. A folder holds a path
    /// by whole components: `/media` does not hold `/mediafiles`.
    ///
    /// # Errors
    ///
    /// Names the path and the folders it was checked against where none holds
    /// it, and refuses a path that climbs with `..`. Either is a request the
    /// map cannot place, and an error saying so is more use to the person
    /// setting this up than "no such file" from whatever ran next.
    pub fn to_host(&self, path: &str) -> Result<String, String> {
        let found = self.folders.iter().find_map(|(container, host)| {
            let rest = if container == "/" {
                path.strip_prefix('/')
            } else {
                path.strip_prefix(container.as_str())
                    .filter(|rest| rest.is_empty() || rest.starts_with('/'))
            }?;

            Some((host, rest))
        });

        let Some((host, rest)) = found else {
            let folders = self
                .folders
                .iter()
                .map(|(container, _)| container.as_str())
                .collect::<Vec<_>>()
                .join(", ");

            return Err(format!(
                "{path} is in none of the folders {VARIABLE} maps ({folders}); add the folder it is in"
            ));
        };

        let mut translated = host.clone();

        for part in rest.split('/').filter(|part| !part.is_empty()) {
            if !matches!(
                Path::new(part).components().next(),
                Some(Component::Normal(_))
            ) {
                return Err(format!("{path} climbs out of its folder, and is refused"));
            }

            translated.push(part);
        }

        Ok(translated.to_string_lossy().into_owned())
    }
}

static INSTALLED: OnceLock<PathMap> = OnceLock::new();

/// Makes a map the one every request is read through.
///
/// Called once, at startup, before anything is listening. A second call is
/// ignored, since a map that changed under requests already in flight would
/// send two halves of one session to different places.
pub fn install(map: PathMap) {
    let _ = INSTALLED.set(map);
}

/// Translates a path the server named, where a map is installed.
///
/// # Errors
///
/// As [`PathMap::to_host`]. The refusal is logged too, because the server
/// reports only that the request was rejected, and the operator who needs the
/// reason is reading this service's log or its monitor.
pub fn translate(path: String) -> Result<String, String> {
    let Some(map) = INSTALLED.get() else {
        return Ok(path);
    };

    map.to_host(&path).inspect_err(|reason| {
        tracing::warn!(target: "paths", "{reason}");
    })
}

/// Reads a path field from a request and translates it.
///
/// Named in `#[serde(deserialize_with)]` on every request field that names a
/// file, which is what puts the translation in front of every route at once.
///
/// # Errors
///
/// Where the field is not a string, or [`translate`] refuses it.
pub fn deserialize<'de, D>(deserializer: D) -> Result<String, D::Error>
where
    D: Deserializer<'de>,
{
    translate(String::deserialize(deserializer)?).map_err(serde::de::Error::custom)
}

#[cfg(test)]
mod tests {
    use super::PathMap;

    fn map(value: &str) -> PathMap {
        PathMap::parse(value)
            .expect("it parses")
            .expect("it maps something")
    }

    #[test]
    fn translates_a_path_inside_a_mapped_folder() {
        let map = map("/media=/Volumes/Media");

        assert_eq!(
            map.to_host("/media/Films/A Film (2020)/film.mkv"),
            Ok("/Volumes/Media/Films/A Film (2020)/film.mkv".to_owned())
        );
    }

    #[test]
    fn translates_the_folder_itself() {
        assert_eq!(
            map("/media=/Volumes/Media").to_host("/media"),
            Ok("/Volumes/Media".to_owned())
        );
    }

    #[test]
    fn holds_a_path_by_whole_components() {
        assert!(map("/media=/Volumes/Media")
            .to_host("/mediafiles/film.mkv")
            .is_err());
    }

    #[test]
    fn prefers_the_longest_folder_that_holds_the_path() {
        let map = map("/media=/Volumes/Media;/media/films=/Volumes/Films");

        assert_eq!(
            map.to_host("/media/films/film.mkv"),
            Ok("/Volumes/Films/film.mkv".to_owned())
        );
        assert_eq!(
            map.to_host("/media/shows/episode.mkv"),
            Ok("/Volumes/Media/shows/episode.mkv".to_owned())
        );
    }

    #[test]
    fn keeps_downloads_and_media_apart() {
        let map = map("/media=/Volumes/Media; /downloads=/Users/someone/Downloads");

        assert_eq!(
            map.to_host("/downloads/complete/film.mkv"),
            Ok("/Users/someone/Downloads/complete/film.mkv".to_owned())
        );
    }

    #[test]
    fn ignores_a_trailing_slash_on_either_side() {
        let map = map("/media/=/Volumes/Media/");

        assert_eq!(
            map.to_host("/media/film.mkv"),
            Ok("/Volumes/Media/film.mkv".to_owned())
        );
    }

    #[test]
    fn maps_the_root_when_asked_to() {
        assert_eq!(
            map("/=/Volumes/Root").to_host("/media/film.mkv"),
            Ok("/Volumes/Root/media/film.mkv".to_owned())
        );
    }

    #[test]
    fn names_the_folders_it_checked_when_none_holds_the_path() {
        let refusal = map("/media=/Volumes/Media;/downloads=/Downloads")
            .to_host("/srv/film.mkv")
            .expect_err("nothing maps /srv");

        assert!(refusal.contains("/srv/film.mkv"), "{refusal}");
        assert!(refusal.contains("/media"), "{refusal}");
        assert!(refusal.contains("/downloads"), "{refusal}");
    }

    #[test]
    fn refuses_a_path_that_climbs_out_of_its_folder() {
        let map = map("/media=/Volumes/Media");

        assert!(map.to_host("/media/../etc/passwd").is_err());
        assert!(map.to_host("/media/./film.mkv").is_err());
    }

    #[test]
    fn describes_each_folder_and_where_it_lies() {
        assert_eq!(
            map("/media=/Volumes/Media;/downloads=/Downloads").describe(),
            "/downloads is /Downloads, /media is /Volumes/Media"
        );
    }

    #[test]
    fn treats_an_empty_setting_as_no_map() {
        assert_eq!(PathMap::parse(""), Ok(None));
        assert_eq!(PathMap::parse(" ; "), Ok(None));
    }

    #[test]
    fn refuses_a_pair_without_an_equals_sign() {
        assert!(PathMap::parse("/media:/Volumes/Media").is_err());
    }

    #[test]
    fn refuses_a_container_side_that_is_not_absolute() {
        assert!(PathMap::parse("media=/Volumes/Media").is_err());
    }

    #[test]
    fn refuses_an_empty_host_side() {
        assert!(PathMap::parse("/media=").is_err());
    }

    #[test]
    fn refuses_the_whole_map_when_one_pair_is_wrong() {
        assert!(PathMap::parse("/media=/Volumes/Media;downloads=/Downloads").is_err());
    }

    #[test]
    fn passes_a_path_through_when_no_map_is_installed() {
        assert_eq!(
            super::translate("/media/film.mkv".to_owned()),
            Ok("/media/film.mkv".to_owned())
        );
    }
}
