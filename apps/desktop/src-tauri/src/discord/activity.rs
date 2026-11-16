//! What somebody is doing, written the way Discord shows it, as `aDiscordActivity` writes it.

use crate::discord::what_is_playing::{
    Listening, Logo, Look, Party, StatusShows, Time, Watching, WhatIsPlaying,
};
use crate::say::say;
use serde::Serialize;
use tauri::Url;

/// Discord's word for watching.
const WATCHING: u8 = 3;

/// Discord's word for listening.
const LISTENING: u8 = 2;

/// Discord's way of naming the details line in the member list.
const SHOWS_THE_DETAILS: u8 = 2;

/// The one host a film's poster may be drawn from.
const ARTWORK_HOST: &str = "image.tmdb.org";

/// What goes between the parts of a line.
const BETWEEN: &str = " · ";

/// Which Valence is saying so.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Build {
    /// Its version.
    pub version: String,
    /// Whether it is still being worked on.
    pub is_a_dev_build: bool,
}

/// When something started and ends, in seconds.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Timestamps {
    start: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    end: Option<i64>,
}

/// The pictures on the card.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Assets {
    large_image: String,
    large_text: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    small_image: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    small_text: Option<String>,
}

/// A group, as Discord counts one.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Group {
    id: String,
    size: [i64; 2],
}

/// A button on the card.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Button {
    label: String,
    url: String,
}

/// The activity Discord is sent.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct DiscordActivity {
    #[serde(rename = "type")]
    kind: u8,
    #[serde(skip_serializing_if = "Option::is_none")]
    name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    status_display_type: Option<u8>,
    details: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    state: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    timestamps: Option<Timestamps>,
    assets: Assets,
    #[serde(skip_serializing_if = "Option::is_none")]
    party: Option<Group>,
    #[serde(skip_serializing_if = "Option::is_none")]
    buttons: Option<Vec<Button>>,
}

/// Milliseconds as whole seconds.
fn seconds(milliseconds: i64) -> i64 {
    milliseconds.div_euclid(1000)
}

/// The logo to wear.
fn the_logo(look: Look, build: Option<&Build>) -> String {
    let is_dev = build.is_some_and(|build| build.is_a_dev_build);
    let logo = match (is_dev, look.logo) {
        (false, Logo::Light) => "valence-desktop",
        (false, Logo::Dark) => "valence-desktop-dark",
        (true, Logo::Light) => "valence-desktop-dev",
        (true, Logo::Dark) => "valence-desktop-dev-dark",
    };

    logo.to_owned()
}

/// Says how many other people are watching this together, or nothing where somebody is alone.
fn the_company_in(party: Option<&Party>) -> Option<String> {
    let party = party.filter(|party| party.size >= 2)?;
    let others = party.size - 1;
    let form = if others == 1 { "one" } else { "other" };

    Some(say(
        &format!("desktop.main.aDiscordActivity.withOthers.{form}"),
        &[("count", &others.to_string())],
    ))
}

/// Names who made a track the way somebody would say it aloud.
fn the_artists_in(artists: &[String]) -> Option<String> {
    match artists {
        [] => None,
        [only] => Some(only.clone()),
        [rest @ .., last] => Some(format!("{} & {last}", rest.join(", "))),
    }
}

/// The line under the details: what is playing, who with, and whether it has stopped.
fn the_state_line(line: Option<String>, party: Option<&Party>, is_paused: bool) -> Option<String> {
    let body = [line, the_company_in(party)]
        .into_iter()
        .flatten()
        .collect::<Vec<_>>()
        .join(BETWEEN);
    let said = (!body.is_empty()).then_some(body);

    if !is_paused {
        return said;
    }

    Some(match said {
        None => say("common.paused", &[]),
        Some(line) => say(
            "desktop.main.aDiscordActivity.pausedLine",
            &[("line", &line)],
        ),
    })
}

/// A film's poster, where it comes from the catalogue's own image host over https.
fn the_artwork_for(artwork: Option<&str>) -> Option<String> {
    let artwork = artwork?;
    let asked = Url::parse(artwork).ok()?;

    (asked.scheme() == "https" && asked.host_str() == Some(ARTWORK_HOST))
        .then(|| artwork.to_owned())
}

/// A track's cover, wherever it comes from, so long as it is over https.
fn the_tracks_artwork_for(artwork: Option<&str>) -> Option<String> {
    let artwork = artwork?;

    (Url::parse(artwork).ok()?.scheme() == "https").then(|| artwork.to_owned())
}

/// The clock, unless paused: from the start, and to the end where it is known and counted down to.
fn the_clock(
    is_paused: bool,
    started_at: i64,
    ends_at: Option<i64>,
    look: Look,
) -> Option<Timestamps> {
    (!is_paused).then(|| Timestamps {
        start: seconds(started_at),
        end: ends_at.filter(|_| look.time != Time::Elapsed).map(seconds),
    })
}

/// The group, where there is one and the profile shows it.
fn the_group(company: Option<&Party>) -> Option<Group> {
    company.map(|party| Group {
        id: party.id.clone(),
        size: [party.size, party.size],
    })
}

/// A track, as Discord shows it: named after who made it.
fn a_track(playing: &Listening, logo: String, named: String) -> DiscordActivity {
    let company = playing
        .party
        .as_ref()
        .filter(|_| playing.look.shows_party_size);
    let artists = the_artists_in(&playing.artists);
    let state = the_state_line(artists.clone(), company, playing.is_paused);
    let badge = if playing.is_paused {
        say("common.paused", &[])
    } else {
        say("common.playing", &[])
    };

    DiscordActivity {
        kind: LISTENING,
        name: artists,
        status_display_type: None,
        details: playing.title.clone(),
        state,
        timestamps: the_clock(
            playing.is_paused,
            playing.started_at,
            playing.ends_at,
            playing.look,
        ),
        assets: Assets {
            large_image: playing
                .artwork
                .as_deref()
                .filter(|_| playing.look.shows_artwork)
                .and_then(|artwork| the_tracks_artwork_for(Some(artwork)))
                .unwrap_or_else(|| logo.clone()),
            large_text: named,
            small_image: Some(logo),
            small_text: Some(badge),
        },
        party: the_group(company),
        buttons: None,
    }
}

/// Something watched, as Discord shows it: the programme on top and the episode below.
fn a_watch(playing: &Watching, logo: String, named: String) -> DiscordActivity {
    let company = playing
        .party
        .as_ref()
        .filter(|_| playing.look.shows_party_size);
    let episode = match (playing.season, playing.episode) {
        (Some(season), Some(episode)) => Some(say(
            "desktop.main.aDiscordActivity.seriesSeasonEpisodeEpisode",
            &[
                ("season", &season.to_string()),
                ("episode", &episode.to_string()),
            ],
        )),
        _ => None,
    };
    let tmdb = playing
        .tmdb_id
        .as_ref()
        .filter(|_| playing.look.shows_tmdb_link)
        .map(|id| Button {
            label: say("desktop.main.aDiscordActivity.viewOnTMDB", &[]),
            url: format!(
                "https://www.themoviedb.org/{}/{id}",
                if playing.is_series { "tv" } else { "movie" }
            ),
        });
    let line = playing
        .series
        .as_ref()
        .map(|_| episode.unwrap_or_else(|| playing.title.clone()));

    DiscordActivity {
        kind: WATCHING,
        name: None,
        status_display_type: (playing.look.status_shows == StatusShows::Title)
            .then_some(SHOWS_THE_DETAILS),
        details: playing
            .series
            .clone()
            .unwrap_or_else(|| playing.title.clone()),
        state: the_state_line(line, company, playing.is_paused),
        timestamps: the_clock(
            playing.is_paused,
            playing.started_at,
            playing.ends_at,
            playing.look,
        ),
        assets: Assets {
            large_image: playing
                .artwork
                .as_deref()
                .filter(|_| playing.look.shows_artwork)
                .and_then(|artwork| the_artwork_for(Some(artwork)))
                .unwrap_or(logo),
            large_text: named,
            small_image: None,
            small_text: None,
        },
        party: the_group(company),
        buttons: tmdb.map(|button| vec![button]),
    }
}

/// Writes what somebody is doing the way Discord shows it, or nothing to clear the status.
///
/// Browsing gets the top line, the logo, and a clock counting from when Valence opened. Something
/// watched gets the programme on top, the episode below, its poster where the catalogue has one, a
/// clock unless paused, and a TMDB button. A track is named after who made it and wears a badge
/// saying whether it is playing. The look is the profile's own choice, sent with every status.
#[must_use]
pub fn a_discord_activity(
    playing: Option<&WhatIsPlaying>,
    opened_at: i64,
    build: Option<&Build>,
) -> Option<DiscordActivity> {
    let playing = playing?;
    let look = match playing {
        WhatIsPlaying::Watching(watching) => &watching.look,
        WhatIsPlaying::Listening(listening) => &listening.look,
        WhatIsPlaying::Browsing(look) => look,
    };
    let logo = the_logo(*look, build);
    let named = build.map_or_else(
        || say("common.valence", &[]),
        |build| {
            say(
                "screens.adminPage.valenceVersion",
                &[("version", &build.version)],
            )
        },
    );

    Some(match playing {
        WhatIsPlaying::Browsing(_) => DiscordActivity {
            kind: WATCHING,
            name: None,
            status_display_type: None,
            details: say("desktop.main.aDiscordActivity.browsingLibraries", &[]),
            state: None,
            timestamps: Some(Timestamps {
                start: seconds(opened_at),
                end: None,
            }),
            assets: Assets {
                large_image: logo,
                large_text: named,
                small_image: None,
                small_text: None,
            },
            party: None,
            buttons: None,
        },
        WhatIsPlaying::Listening(listening) => a_track(listening, logo, named),
        WhatIsPlaying::Watching(watching) => a_watch(watching, logo, named),
    })
}

#[cfg(test)]
mod tests {
    use super::{a_discord_activity, Build};
    use crate::discord::what_is_playing::{what_is_playing, WhatIsPlaying};
    use serde_json::{json, Value};

    const STARTED: i64 = 1_755_000_000_000;

    const OPENED: i64 = 1_754_990_000_000;

    fn read(said: &Value) -> WhatIsPlaying {
        what_is_playing(said).unwrap_or_else(|| panic!("not playing: {said}"))
    }

    fn an_episode() -> Value {
        json!({
            "kind": "watching",
            "title": "The One With The Thing",
            "series": "A Programme",
            "season": 2,
            "episode": 12,
            "startedAt": STARTED,
            "endsAt": STARTED + 1_400_000,
            "tmdbId": "1399",
            "isSeries": true,
            "isPaused": false,
            "artwork": null,
            "party": null
        })
    }

    fn a_film() -> Value {
        json!({
            "kind": "watching",
            "title": "A Film",
            "series": null,
            "season": null,
            "episode": null,
            "startedAt": STARTED,
            "endsAt": null,
            "tmdbId": "550",
            "isSeries": false,
            "isPaused": false,
            "artwork": null,
            "party": null
        })
    }

    fn a_track() -> Value {
        json!({
            "kind": "listening",
            "title": "How Not To Drown",
            "artists": ["CHVRCHES", "Robert Smith"],
            "startedAt": STARTED,
            "endsAt": STARTED + 331_000,
            "isPaused": false,
            "artwork": null,
            "party": null
        })
    }

    fn activity(said: &Value) -> Value {
        activity_of(said, None)
    }

    fn activity_of(said: &Value, build: Option<&Build>) -> Value {
        serde_json::to_value(a_discord_activity(Some(&read(said)), OPENED, build))
            .unwrap_or_default()
    }

    fn with(mut said: Value, key: &str, value: Value) -> Value {
        said[key] = value;

        said
    }

    #[test]
    fn puts_the_programme_on_the_top_line_and_the_episode_below_it() {
        let said = activity(&an_episode());

        assert_eq!(said["details"], "A Programme");
        assert_eq!(said["state"], "Series 2, Episode 12");
    }

    #[test]
    fn gives_a_film_one_line() {
        let said = activity(&a_film());

        assert_eq!(said["details"], "A Film");
        assert!(said.get("state").is_none());
        assert_eq!(said["type"], 3);
    }

    #[test]
    fn sends_the_times_in_seconds() {
        assert_eq!(
            activity(&an_episode())["timestamps"],
            json!({ "start": 1_755_000_000, "end": 1_755_001_400 })
        );
        assert_eq!(
            activity(&a_film())["timestamps"],
            json!({ "start": 1_755_000_000 })
        );
    }

    #[test]
    fn draws_the_valence_logo_where_the_catalogue_has_no_picture() {
        assert_eq!(
            activity(&a_film())["assets"],
            json!({ "large_image": "valence-desktop", "large_text": "Valence" })
        );
    }

    #[test]
    fn offers_a_way_to_look_it_up_pointed_at_the_right_kind_of_page() {
        assert_eq!(
            activity(&a_film())["buttons"],
            json!([{ "label": "View on TMDB", "url": "https://www.themoviedb.org/movie/550" }])
        );
        assert_eq!(
            activity(&an_episode())["buttons"][0]["url"],
            "https://www.themoviedb.org/tv/1399"
        );
        assert!(activity(&with(a_film(), "tmdbId", Value::Null))
            .get("buttons")
            .is_none());
    }

    #[test]
    fn says_nothing_at_all_when_nothing_is_playing() {
        assert_eq!(a_discord_activity(None, OPENED, None), None);
    }

    #[test]
    fn says_somebody_has_valence_open_when_they_are_between_things() {
        assert_eq!(
            activity(&json!({ "kind": "browsing" })),
            json!({
                "type": 3,
                "details": "Browsing libraries",
                "timestamps": { "start": 1_754_990_000 },
                "assets": { "large_image": "valence-desktop", "large_text": "Valence" }
            })
        );
    }

    #[test]
    fn draws_the_dev_logo_for_a_build_still_being_worked_on() {
        let build = Build {
            version: "1.10.0-dev.12".to_owned(),
            is_a_dev_build: true,
        };

        assert_eq!(
            activity_of(
                &json!({ "kind": "browsing", "look": { "logo": "dark" } }),
                Some(&build)
            )["assets"],
            json!({ "large_image": "valence-desktop-dev-dark", "large_text": "Valence 1.10.0-dev.12" })
        );
    }

    #[test]
    fn draws_the_poster_only_from_the_catalogues_own_host() {
        let poster = "https://image.tmdb.org/t/p/w500/a.jpg";

        assert_eq!(
            activity(&with(a_film(), "artwork", json!(poster)))["assets"]["large_image"],
            poster
        );
        assert_eq!(
            activity(&with(
                a_film(),
                "artwork",
                json!("https://my.server/poster.jpg")
            ))["assets"]["large_image"],
            "valence-desktop"
        );
    }

    #[test]
    fn takes_the_clock_off_while_paused_and_says_so() {
        let said = activity(&with(an_episode(), "isPaused", json!(true)));

        assert!(said.get("timestamps").is_none());
        assert_eq!(said["state"], "Paused — Series 2, Episode 12");
        assert_eq!(
            activity(&with(a_film(), "isPaused", json!(true)))["state"],
            "Paused"
        );
    }

    #[test]
    fn says_who_is_watching_together() {
        let said = activity(&with(
            an_episode(),
            "party",
            json!({ "id": "p", "size": 3 }),
        ));

        assert_eq!(said["state"], "Series 2, Episode 12 · with 2 others");
        assert_eq!(said["party"], json!({ "id": "p", "size": [3, 3] }));
        assert_eq!(
            activity(&with(a_film(), "party", json!({ "id": "p", "size": 2 })))["state"],
            "with 1 other"
        );
    }

    #[test]
    fn names_a_track_after_who_made_it_and_wears_a_badge() {
        let said = activity(&a_track());

        assert_eq!(said["type"], 2);
        assert_eq!(said["name"], "CHVRCHES & Robert Smith");
        assert_eq!(said["details"], "How Not To Drown");
        assert_eq!(said["state"], "CHVRCHES & Robert Smith");
        assert_eq!(said["assets"]["small_image"], "valence-desktop");
        assert_eq!(said["assets"]["small_text"], "Playing");
    }

    #[test]
    fn counts_up_and_names_the_title_where_the_profile_asks() {
        let said = activity(&with(
            an_episode(),
            "look",
            json!({ "time": "elapsed", "statusShows": "title" }),
        ));

        assert_eq!(said["timestamps"], json!({ "start": 1_755_000_000 }));
        assert_eq!(said["status_display_type"], 2);
    }
}
