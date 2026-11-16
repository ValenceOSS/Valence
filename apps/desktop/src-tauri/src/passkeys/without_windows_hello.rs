//! What stands in for Windows Hello on a system that has none to ask.

use crate::passkeys::asking::{Answered, PasskeyAsk};
use crate::passkeys::making::{Made, PasskeyMaking};

/// Whether this build can ask Windows for a passkey, which only Windows' can.
pub const CAN_ASK: bool = false;

/// Refuses, since there is no Windows to ask.
///
/// # Errors
///
/// Always.
pub fn ask_for_a_passkey(window: usize, ask: &PasskeyAsk) -> Result<Answered, String> {
    let _ = (window, ask);

    Err(String::from("NotSupportedError"))
}

/// Refuses, since there is no Windows to ask.
///
/// # Errors
///
/// Always.
pub fn make_a_passkey(window: usize, making: &PasskeyMaking) -> Result<Made, String> {
    let _ = (window, making);

    Err(String::from("NotSupportedError"))
}
