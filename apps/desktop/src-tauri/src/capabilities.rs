//! What the app's own pages may ask of it, granted to the loopback server's origin alone.
//!
//! The capabilities are written in `capabilities/` so the build checks every permission they name,
//! but they name no address there and grant nothing as built: the page's origin includes a port
//! chosen as the app starts, and a pattern wide enough to match whichever it is would match every
//! other server on this machine's loopback address too. So once the port is known, each one is
//! granted again to `http://127.0.0.1:<port>` and nothing else.

use tauri::utils::acl::capability::{Capability, CapabilityRemote};
use tauri::Manager;

/// The capabilities as written: the main window's, and the update window's.
const WRITTEN: [&str; 2] = [
    include_str!("../capabilities/main.json"),
    include_str!("../capabilities/update.json"),
];

/// `written` granted to pages from `origin` and nowhere else, as Tauri reads a capability.
///
/// # Errors
///
/// When `written` is not a capability.
pub fn granted_to(written: &str, origin: &str) -> serde_json::Result<String> {
    let mut capability: Capability = serde_json::from_str(written)?;

    capability.local = false;
    capability.remote = Some(CapabilityRemote {
        urls: vec![origin.to_owned()],
    });

    serde_json::to_string(&capability)
}

/// Grants the app's capabilities to pages served from `origin`.
///
/// # Errors
///
/// When a capability is not one, or Tauri will not take it.
pub fn grant(app: &tauri::App, origin: &str) -> Result<(), Box<dyn std::error::Error>> {
    for written in WRITTEN {
        app.add_capability(granted_to(written, origin)?)?;
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tauri::utils::acl::capability::CapabilityFile;

    fn read(granted: &str) -> Capability {
        match granted.parse::<CapabilityFile>().expect("a capability") {
            CapabilityFile::Capability(capability) => capability,
            CapabilityFile::List(_) | CapabilityFile::NamedList { .. } => {
                panic!("one capability, not a list")
            }
        }
    }

    #[test]
    fn grants_nothing_as_written() {
        for written in WRITTEN {
            let capability = read(written);

            assert!(!capability.local, "{}", capability.identifier);
            assert!(capability.remote.is_none(), "{}", capability.identifier);
        }
    }

    #[test]
    fn grants_each_capability_to_the_one_origin() {
        for written in WRITTEN {
            let before = read(written);
            let after = read(&granted_to(written, "http://127.0.0.1:41847").expect("granted"));

            assert_eq!(
                after.remote.map(|remote| remote.urls),
                Some(vec!["http://127.0.0.1:41847".to_owned()])
            );
            assert!(!after.local);
            assert_eq!(after.identifier, before.identifier);
            assert_eq!(after.windows, before.windows);
            assert_eq!(after.permissions, before.permissions);
        }
    }

    #[test]
    fn keeps_the_update_window_to_what_it_needs() {
        let update = read(WRITTEN[1]);
        let named = serde_json::to_value(&update.permissions).expect("JSON");

        assert_eq!(update.windows, vec!["update-*".to_owned()]);
        assert!(named
            .as_array()
            .expect("a list")
            .iter()
            .all(
                |permission| !permission.as_str().is_some_and(|name| name.contains("held")
                    || name.contains("passkeys")
                    || name.contains("preferences")
                    || name.contains("cast"))
            ));
    }
}
