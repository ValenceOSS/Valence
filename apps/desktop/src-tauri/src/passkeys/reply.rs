//! What the window is answered with after asking for a passkey.

use crate::say::say;
use serde::Serialize;

/// What came of asking for a passkey: what was done, that somebody cancelled, or why it failed.
///
/// An answer rather than an error, so the page has words to put on a screen.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(tag = "kind", rename_all = "lowercase")]
pub enum Reply<Done> {
    /// It worked.
    Done {
        /// What came of it.
        done: Done,
    },
    /// Somebody closed the prompt, or let it time out.
    Cancelled,
    /// It failed.
    Failed {
        /// Why, in words to show.
        reason: String,
    },
}

impl<Done> Reply<Done> {
    /// A failure, with the words for it.
    #[must_use]
    pub fn failed(key: &str) -> Self {
        Self::Failed {
            reason: say(key, &[]),
        }
    }
}

impl<Done: Serialize> Reply<Done> {
    /// The reply as the JSON the window reads.
    #[must_use]
    pub fn said(&self) -> serde_json::Value {
        serde_json::to_value(self).unwrap_or(serde_json::Value::Null)
    }
}

/// Reads a refusal from Windows, which is named the way a browser would name it.
///
/// `NotAllowedError` is how Windows says somebody closed its prompt or let it time out, which is
/// somebody changing their mind rather than anything going wrong, so it is not something to show.
#[must_use]
pub fn what_windows_said<Done>(name: Option<&str>) -> Reply<Done> {
    match name.unwrap_or_default() {
        "NotAllowedError" | "AbortError" => Reply::Cancelled,
        "InvalidStateError" => {
            Reply::failed("desktop.main.whatWindowsSaid.thisDeviceAlreadyHasAPasskey")
        }
        "NotSupportedError" => {
            Reply::failed("desktop.main.whatWindowsSaid.thisDeviceCannotMakeTheKind")
        }
        "SecurityError" => Reply::failed("desktop.main.whatWindowsSaid.windowsWouldNotUseAPasskey"),
        _ => Reply::failed("desktop.main.whatWindowsSaid.windowsCouldNotUseAPasskey"),
    }
}

#[cfg(test)]
mod tests {
    use super::{what_windows_said, Reply};
    use serde_json::json;

    #[test]
    fn reads_a_closed_prompt_as_somebody_changing_their_mind() {
        assert_eq!(
            what_windows_said::<()>(Some("NotAllowedError")),
            Reply::Cancelled
        );
    }

    #[test]
    fn says_a_passkey_already_made_here_is_already_here() {
        assert_eq!(
            what_windows_said::<()>(Some("InvalidStateError")),
            Reply::Failed {
                reason: "This device already has a passkey for this account.".to_owned()
            }
        );
    }

    #[test]
    fn says_something_plain_about_anything_else() {
        assert_eq!(
            what_windows_said::<()>(Some("UnknownError")),
            Reply::Failed {
                reason: "Windows couldn’t use a passkey. Try again.".to_owned()
            }
        );
        assert!(matches!(
            what_windows_said::<()>(None),
            Reply::Failed { .. }
        ));
    }

    #[test]
    fn is_read_by_what_came_of_it() {
        assert_eq!(
            Reply::Done { done: "abc" }.said(),
            json!({ "kind": "done", "done": "abc" })
        );
        assert_eq!(
            Reply::<()>::Cancelled.said(),
            json!({ "kind": "cancelled" })
        );
        assert_eq!(
            Reply::<()>::Failed {
                reason: "No.".to_owned()
            }
            .said(),
            json!({ "kind": "failed", "reason": "No." })
        );
    }
}
