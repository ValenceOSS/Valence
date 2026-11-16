//! The words kept files are described in, from the shared strings file.

/// Says one entry of the shared strings file, filling in its values.
#[must_use]
pub fn say_it(key: &str, values: &[(&str, String)]) -> String {
    let values: Vec<(&str, &str)> = values
        .iter()
        .map(|(name, value)| (*name, value.as_str()))
        .collect();

    crate::say::say(key, &values)
}
