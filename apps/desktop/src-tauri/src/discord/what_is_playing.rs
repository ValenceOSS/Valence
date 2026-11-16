//! What a page says is playing, read rather than trusted.
//!
//! It arrives from a page the server drew and ends up in somebody's public Discord status, so a
//! title far longer than a title, or a number where a name should be, stops here. The artwork and
//! the look are read on their own terms: a picture that cannot be used is a reason to draw the logo
//! instead, and a look that cannot be read is drawn the usual way.

use serde_json::{Map, Value};
use tauri::Url;

/// What the status names in the member list.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StatusShows {
    /// Valence.
    Valence,
    /// The title.
    Title,
}

/// Which logo the status wears.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Logo {
    /// The light one.
    Light,
    /// The dark one.
    Dark,
}

/// Which way the clock counts.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Time {
    /// Down to the end.
    Remaining,
    /// Up from the start.
    Elapsed,
}

/// How the profile asked the status to look, as `DiscordLookSchema` reads it.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Look {
    /// What the status names in the member list.
    pub status_shows: StatusShows,
    /// Which logo it wears.
    pub logo: Logo,
    /// Whether it draws the artwork.
    pub shows_artwork: bool,
    /// Which way the clock counts.
    pub time: Time,
    /// Whether it offers the TMDB button.
    pub shows_tmdb_link: bool,
    /// Whether it says how many are watching together.
    pub shows_party_size: bool,
}

impl Default for Look {
    fn default() -> Self {
        Self {
            status_shows: StatusShows::Valence,
            logo: Logo::Light,
            shows_artwork: true,
            time: Time::Remaining,
            shows_tmdb_link: true,
            shows_party_size: true,
        }
    }
}

/// A watch party.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Party {
    /// Its id.
    pub id: String,
    /// How many are in it.
    pub size: i64,
}

/// Something being watched.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Watching {
    /// The film's or the episode's title.
    pub title: String,
    /// The programme, for an episode.
    pub series: Option<String>,
    /// The season, for an episode.
    pub season: Option<i64>,
    /// The episode's number.
    pub episode: Option<i64>,
    /// When it started, in milliseconds.
    pub started_at: i64,
    /// When it ends, in milliseconds, where that is known.
    pub ends_at: Option<i64>,
    /// Its TMDB id.
    pub tmdb_id: Option<String>,
    /// Whether it belongs to a programme.
    pub is_series: bool,
    /// Whether it is paused.
    pub is_paused: bool,
    /// Its poster's address.
    pub artwork: Option<String>,
    /// Who it is being watched with.
    pub party: Option<Party>,
    /// How the status looks.
    pub look: Look,
}

/// A track being listened to.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Listening {
    /// Its title.
    pub title: String,
    /// Who made it.
    pub artists: Vec<String>,
    /// When it started, in milliseconds.
    pub started_at: i64,
    /// When it ends, in milliseconds, where that is known.
    pub ends_at: Option<i64>,
    /// Whether it is paused.
    pub is_paused: bool,
    /// Its cover's address.
    pub artwork: Option<String>,
    /// Who it is being listened to with.
    pub party: Option<Party>,
    /// How the status looks.
    pub look: Look,
}

/// What is happening, as the page said it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WhatIsPlaying {
    /// Something is being watched.
    Watching(Watching),
    /// A track is being listened to.
    Listening(Listening),
    /// Valence is open, between things.
    Browsing(Look),
}

/// Why a field was refused: it was missing, or not what the schema allows.
struct Refused;

/// A string's length as JavaScript counts it.
fn length_of(text: &str) -> usize {
    text.encode_utf16().count()
}

/// A string of a length the schema allows.
fn text_of(value: Option<&Value>, longest: usize) -> Option<String> {
    let text = value?.as_str()?;

    (1..=longest)
        .contains(&length_of(text))
        .then(|| text.to_owned())
}

/// A whole number in a range, as JavaScript reads one: `5` and `5.0` alike.
fn whole_of(value: Option<&Value>, least: i64, most: i64) -> Option<i64> {
    let value = value?;
    let whole = value.as_i64().or_else(|| {
        value.as_f64().and_then(|number| {
            let is_whole = number.fract() == 0.0 && number.abs() < 9_007_199_254_740_992.0;

            #[allow(
                clippy::cast_possible_truncation,
                reason = "a whole number short of 2^53 is exactly an i64"
            )]
            is_whole.then_some(number as i64)
        })
    })?;

    (least..=most).contains(&whole).then_some(whole)
}

/// Something that may be null, but must be there: refused where it is missing or wrong.
fn nullable<T>(
    value: Option<&Value>,
    read: impl Fn(Option<&Value>) -> Option<T>,
) -> Result<Option<T>, Refused> {
    match value {
        Some(Value::Null) => Ok(None),
        Some(_) => read(value).map(Some).ok_or(Refused),
        None => Err(Refused),
    }
}

/// A true or false.
fn flag_of(value: Option<&Value>) -> Option<bool> {
    value?.as_bool()
}

/// A TMDB id: digits, a dozen at most.
fn tmdb_id_of(value: Option<&Value>) -> Option<String> {
    let id = value?.as_str()?;

    ((1..=12).contains(&id.len()) && id.bytes().all(|byte| byte.is_ascii_digit()))
        .then(|| id.to_owned())
}

/// An address, or nothing where there is none or it is not one.
fn artwork_of(value: Option<&Value>) -> Option<String> {
    let address = value?.as_str()?;

    Url::parse(address).ok().map(|_| address.to_owned())
}

/// A watch party, or nothing where there is none or it is not one.
fn party_of(value: Option<&Value>) -> Option<Party> {
    let party = value?.as_object()?;

    Some(Party {
        id: text_of(party.get("id"), 100)?,
        size: whole_of(party.get("size"), 1, 100)?,
    })
}

/// One field of the look: its default where it is missing, nothing where it is wrong.
fn look_field<T>(
    look: &Map<String, Value>,
    key: &str,
    read: impl Fn(&Value) -> Option<T>,
    default: T,
) -> Option<T> {
    match look.get(key) {
        None => Some(default),
        Some(value) => read(value),
    }
}

/// How the status looks, or the usual look where it cannot be read.
fn look_of(value: Option<&Value>) -> Look {
    let usual = Look::default();
    let Some(look) = value.and_then(Value::as_object) else {
        return usual;
    };
    let read = || {
        Some(Look {
            status_shows: look_field(
                look,
                "statusShows",
                |value| match value.as_str()? {
                    "valence" => Some(StatusShows::Valence),
                    "title" => Some(StatusShows::Title),
                    _ => None,
                },
                usual.status_shows,
            )?,
            logo: look_field(
                look,
                "logo",
                |value| match value.as_str()? {
                    "light" => Some(Logo::Light),
                    "dark" => Some(Logo::Dark),
                    _ => None,
                },
                usual.logo,
            )?,
            shows_artwork: look_field(look, "showsArtwork", Value::as_bool, usual.shows_artwork)?,
            time: look_field(
                look,
                "time",
                |value| match value.as_str()? {
                    "remaining" => Some(Time::Remaining),
                    "elapsed" => Some(Time::Elapsed),
                    _ => None,
                },
                usual.time,
            )?,
            shows_tmdb_link: look_field(
                look,
                "showsTmdbLink",
                Value::as_bool,
                usual.shows_tmdb_link,
            )?,
            shows_party_size: look_field(
                look,
                "showsPartySize",
                Value::as_bool,
                usual.shows_party_size,
            )?,
        })
    };

    read().unwrap_or(usual)
}

/// Something being watched, or nothing where it is not.
fn watching_of(said: &Map<String, Value>) -> Option<Watching> {
    Some(Watching {
        title: text_of(said.get("title"), 200)?,
        series: nullable(said.get("series"), |value| text_of(value, 200)).ok()?,
        season: nullable(said.get("season"), |value| whole_of(value, 0, 1000)).ok()?,
        episode: nullable(said.get("episode"), |value| whole_of(value, 0, 10_000)).ok()?,
        started_at: whole_of(said.get("startedAt"), 0, i64::MAX)?,
        ends_at: nullable(said.get("endsAt"), |value| whole_of(value, 0, i64::MAX)).ok()?,
        tmdb_id: nullable(said.get("tmdbId"), tmdb_id_of).ok()?,
        is_series: flag_of(said.get("isSeries"))?,
        is_paused: flag_of(said.get("isPaused")).unwrap_or(false),
        artwork: artwork_of(said.get("artwork")),
        party: party_of(said.get("party")),
        look: look_of(said.get("look")),
    })
}

/// A track being listened to, or nothing where it is not.
fn listening_of(said: &Map<String, Value>) -> Option<Listening> {
    let artists = said.get("artists")?.as_array()?;

    if artists.len() > 20 {
        return None;
    }

    Some(Listening {
        title: text_of(said.get("title"), 200)?,
        artists: artists
            .iter()
            .map(|artist| text_of(Some(artist), 200))
            .collect::<Option<Vec<_>>>()?,
        started_at: whole_of(said.get("startedAt"), 0, i64::MAX)?,
        ends_at: nullable(said.get("endsAt"), |value| whole_of(value, 0, i64::MAX)).ok()?,
        is_paused: flag_of(said.get("isPaused")).unwrap_or(false),
        artwork: artwork_of(said.get("artwork")),
        party: party_of(said.get("party")),
        look: look_of(said.get("look")),
    })
}

/// Reads what a page says is playing, or nothing where it said nothing or something else.
#[must_use]
pub fn what_is_playing(said: &Value) -> Option<WhatIsPlaying> {
    let said = said.as_object()?;

    match said.get("kind")?.as_str()? {
        "watching" => watching_of(said).map(WhatIsPlaying::Watching),
        "listening" => listening_of(said).map(WhatIsPlaying::Listening),
        "browsing" => Some(WhatIsPlaying::Browsing(look_of(said.get("look")))),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::{what_is_playing, Logo, Look, Party, StatusShows, Time, WhatIsPlaying};
    use serde_json::{json, Value};

    fn said() -> Value {
        json!({
            "kind": "watching",
            "title": "A Film",
            "series": null,
            "season": null,
            "episode": null,
            "startedAt": 1_755_000_000_000_i64,
            "endsAt": null,
            "tmdbId": "550",
            "isSeries": false,
            "isPaused": false,
            "artwork": null,
            "party": null,
            "look": {
                "statusShows": "valence",
                "logo": "light",
                "showsArtwork": true,
                "time": "remaining",
                "showsTmdbLink": true,
                "showsPartySize": true
            }
        })
    }

    fn with(key: &str, value: Value) -> Value {
        let mut changed = said();

        changed[key] = value;

        changed
    }

    fn watching(read: Option<WhatIsPlaying>) -> super::Watching {
        match read {
            Some(WhatIsPlaying::Watching(watching)) => watching,
            other => panic!("not watching: {other:?}"),
        }
    }

    #[test]
    fn reads_what_a_page_said_is_playing() {
        let read = watching(what_is_playing(&said()));

        assert_eq!(read.title, "A Film");
        assert_eq!(read.tmdb_id.as_deref(), Some("550"));
        assert_eq!(read.started_at, 1_755_000_000_000);
        assert_eq!(read.look, Look::default());
    }

    #[test]
    fn reads_nothing_as_nothing_which_is_how_a_status_clears() {
        assert_eq!(what_is_playing(&Value::Null), None);
    }

    #[test]
    fn refuses_a_title_longer_than_a_title() {
        assert_eq!(
            what_is_playing(&with("title", json!("x".repeat(500)))),
            None
        );
    }

    #[test]
    fn refuses_an_id_that_is_not_one_since_it_is_put_straight_into_a_link() {
        assert_eq!(
            what_is_playing(&with("tmdbId", json!("javascript:alert(1)"))),
            None
        );
    }

    #[test]
    fn refuses_a_shape_it_does_not_recognise() {
        assert_eq!(what_is_playing(&json!({ "title": "A Film" })), None);
        assert_eq!(what_is_playing(&json!("a string")), None);
    }

    #[test]
    fn reads_an_episode_which_carries_the_series_and_the_numbers() {
        let mut episode = said();

        episode["series"] = json!("A Programme");
        episode["season"] = json!(2);
        episode["episode"] = json!(12.0);
        episode["isSeries"] = json!(true);

        let read = watching(what_is_playing(&episode));

        assert_eq!(read.series.as_deref(), Some("A Programme"));
        assert_eq!((read.season, read.episode), (Some(2), Some(12)));
    }

    #[test]
    fn reads_somebody_browsing() {
        assert_eq!(
            what_is_playing(&json!({ "kind": "browsing", "look": said()["look"] })),
            Some(WhatIsPlaying::Browsing(Look::default()))
        );
    }

    #[test]
    fn reads_what_a_page_from_before_the_settings_said() {
        let mut older = said();

        if let Some(older) = older.as_object_mut() {
            older.remove("look");
        }

        assert_eq!(what_is_playing(&older), what_is_playing(&said()));
        assert_eq!(
            what_is_playing(&json!({ "kind": "browsing" })),
            Some(WhatIsPlaying::Browsing(Look::default()))
        );
    }

    #[test]
    fn reads_how_the_profile_asked_the_status_to_look() {
        let read = watching(what_is_playing(&with(
            "look",
            json!({ "statusShows": "title", "logo": "dark", "time": "elapsed" }),
        )));

        assert_eq!(
            read.look,
            Look {
                status_shows: StatusShows::Title,
                logo: Logo::Dark,
                time: Time::Elapsed,
                ..Look::default()
            }
        );
    }

    #[test]
    fn falls_back_to_the_usual_look_rather_than_dropping_the_status() {
        assert_eq!(
            what_is_playing(&with("look", json!({ "logo": "sepia" }))),
            what_is_playing(&said())
        );
    }

    #[test]
    fn refuses_a_state_it_does_not_know() {
        assert_eq!(what_is_playing(&json!({ "kind": "something-else" })), None);
    }

    #[test]
    fn keeps_what_is_playing_when_the_picture_is_one_it_cannot_use() {
        assert_eq!(
            watching(what_is_playing(&with("artwork", json!("not-a-url")))).artwork,
            None
        );
    }

    #[test]
    fn reads_a_watch_party() {
        assert_eq!(
            watching(what_is_playing(&with(
                "party",
                json!({ "id": "a-party", "size": 3 })
            )))
            .party,
            Some(Party {
                id: "a-party".to_owned(),
                size: 3
            })
        );
    }

    #[test]
    fn reads_a_track_which_carries_who_made_it() {
        let track = json!({
            "kind": "listening",
            "title": "How Not To Drown",
            "artists": ["CHVRCHES", "Robert Smith"],
            "startedAt": 1_755_000_000_000_i64,
            "endsAt": 1_755_000_331_000_i64,
            "isPaused": false,
            "artwork": null,
            "party": null
        });

        let Some(WhatIsPlaying::Listening(read)) = what_is_playing(&track) else {
            panic!("not a track");
        };

        assert_eq!(
            read.artists,
            vec!["CHVRCHES".to_owned(), "Robert Smith".to_owned()]
        );
        assert_eq!(read.ends_at, Some(1_755_000_331_000));
    }

    #[test]
    fn refuses_more_names_on_a_track_than_anybody_would_list() {
        let artists: Vec<String> = (0..21).map(|at| format!("Artist {at}")).collect();

        assert_eq!(
            what_is_playing(&json!({
                "kind": "listening",
                "title": "How Not To Drown",
                "artists": artists,
                "startedAt": 1_755_000_000_000_i64,
                "endsAt": null,
                "isPaused": false,
                "artwork": null,
                "party": null
            })),
            None
        );
    }
}
