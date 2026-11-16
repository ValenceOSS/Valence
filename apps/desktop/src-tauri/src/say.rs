//! Says what a person reads, in the words from the shared strings file.

use std::collections::HashMap;
use std::sync::LazyLock;

use serde::Deserialize;

const STRINGS: &str = include_str!("../../../../packages/i18n/strings-en.json");

static WORDS: LazyLock<HashMap<String, String>> = LazyLock::new(|| words_in(STRINGS));

#[derive(Deserialize)]
struct Entry {
    handler: String,
    text: String,
}

/// Reads the strings file into its words, by handler.
fn words_in(file: &str) -> HashMap<String, String> {
    serde_json::from_str::<Vec<Entry>>(file)
        .map(|entries| {
            entries
                .into_iter()
                .map(|entry| (entry.handler, entry.text))
                .collect()
        })
        .unwrap_or_default()
}

/// Says the words kept under `key`, with each `{name}` in them filled from `values`.
///
/// A gap with nothing given for it is left as written, and a key the file does not have is said as
/// itself, so something missing shows on screen rather than quietly vanishing.
#[must_use]
pub fn say(key: &str, values: &[(&str, &str)]) -> String {
    fill_gaps(WORDS.get(key).map_or(key, String::as_str), values)
}

/// Fills each `{name}` in `text` from `values`, leaving a gap with nothing given for it as written.
fn fill_gaps(text: &str, values: &[(&str, &str)]) -> String {
    let mut said = String::with_capacity(text.len());
    let mut rest = text;

    while let Some(open) = rest.find('{') {
        said.push_str(&rest[..open]);

        let after = &rest[open + 1..];
        let gap = after.find('}').map(|close| &after[..close]).filter(|name| {
            !name.is_empty() && name.chars().all(|c| c.is_alphanumeric() || c == '_')
        });

        if let Some(name) = gap {
            if let Some((_, value)) = values.iter().find(|(given, _)| *given == name) {
                said.push_str(value);
            } else {
                said.push('{');
                said.push_str(name);
                said.push('}');
            }

            rest = &after[name.len() + 1..];
        } else {
            said.push('{');
            rest = after;
        }
    }

    said.push_str(rest);
    said
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn says_the_words_from_the_strings_file() {
        assert_eq!(
            say("common.noValenceHasBeenChosenYet", &[]),
            "No Valence server has been selected yet."
        );
    }

    #[test]
    fn fills_the_gaps() {
        assert_eq!(
            say(
                "desktop.main.theApplication.valenceCouldNotBeReachedAt",
                &[("server", "http://nas:8420")]
            ),
            "Couldn’t connect to Valence at http://nas:8420."
        );
    }

    #[test]
    fn says_an_unknown_key_as_itself() {
        assert_eq!(say("no.such.key", &[]), "no.such.key");
    }

    #[test]
    fn leaves_a_gap_with_nothing_given_as_written() {
        assert_eq!(fill_gaps("a {b} c", &[]), "a {b} c");
    }

    #[test]
    fn leaves_braces_that_are_not_gaps_alone() {
        assert_eq!(
            fill_gaps("{ x } {} {a-b} {", &[("x", "1")]),
            "{ x } {} {a-b} {"
        );
    }

    #[test]
    fn fills_a_gap_more_than_once() {
        assert_eq!(fill_gaps("{n}+{n}={m}", &[("n", "1"), ("m", "2")]), "1+1=2");
    }

    #[test]
    fn reads_nothing_from_a_broken_file() {
        assert!(words_in("not json").is_empty());
    }
}
