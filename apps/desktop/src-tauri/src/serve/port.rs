//! Which port the loopback server listens on.
//!
//! The page's origin includes the port, and the page's own storage belongs to its origin, so the
//! same port is wanted every launch: the one that worked last time, then a fixed one and the nine
//! after it. Only where every one is taken does the system choose, and the page starts that launch
//! with its storage empty.

use std::fs;
use std::io;
use std::net::{Ipv4Addr, SocketAddr};
use std::path::Path;

use tokio::net::{TcpListener, TcpSocket};

/// The port the loopback server would rather listen on.
pub const PREFERRED_PORT: u16 = 41_847;

const TRIES: u16 = 10;

const BACKLOG: u32 = 1024;

/// The ports to try, in order: the one remembered, the preferred one and the nine after it, and
/// last of all any port the system will give.
#[must_use]
pub fn candidates(remembered: Option<u16>) -> Vec<u16> {
    let mut ports: Vec<u16> = remembered.filter(|port| *port != 0).into_iter().collect();

    for port in (0..TRIES).map(|offset| PREFERRED_PORT + offset) {
        if !ports.contains(&port) {
            ports.push(port);
        }
    }

    ports.push(0);
    ports
}

/// The port remembered in `file`, if one is.
#[must_use]
pub fn remembered(file: &Path) -> Option<u16> {
    fs::read_to_string(file)
        .ok()
        .and_then(|text| text.trim().parse().ok())
        .filter(|port| *port != 0)
}

/// Remembers `port` in `file`, for the next launch to try first.
///
/// # Errors
///
/// When the file cannot be written.
pub fn remember(file: &Path, port: u16) -> io::Result<()> {
    if let Some(folder) = file.parent() {
        fs::create_dir_all(folder)?;
    }

    fs::write(file, port.to_string())
}

/// Listens on the first of `ports` that is free, on this computer's loopback address only. Has to
/// be called within a Tokio runtime.
///
/// # Errors
///
/// When none of them is free.
pub fn listen_on_the_first(ports: &[u16]) -> io::Result<TcpListener> {
    let mut last = io::Error::new(io::ErrorKind::AddrInUse, "no port was free");

    for port in ports {
        match listen_on(*port) {
            Ok(listener) => return Ok(listener),
            Err(error) => last = error,
        }
    }

    Err(last)
}

/// Listens on `port` of the loopback address. On unix a port with connections still closing from
/// the last launch is taken anyway, as it is free in every way that matters.
fn listen_on(port: u16) -> io::Result<TcpListener> {
    let socket = TcpSocket::new_v4()?;

    #[cfg(unix)]
    socket.set_reuseaddr(true)?;

    socket.bind(SocketAddr::from((Ipv4Addr::LOCALHOST, port)))?;
    socket.listen(BACKLOG)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tries_the_remembered_port_first_then_the_preferred_ones_then_any() {
        let ports = candidates(Some(50_000));

        assert_eq!(ports.first(), Some(&50_000));
        assert_eq!(ports.get(1), Some(&PREFERRED_PORT));
        assert_eq!(ports.get(10), Some(&(PREFERRED_PORT + 9)));
        assert_eq!(ports.last(), Some(&0));
        assert_eq!(ports.len(), 12);
    }

    #[test]
    fn does_not_try_a_preferred_port_twice() {
        let ports = candidates(Some(PREFERRED_PORT + 3));

        assert_eq!(ports.len(), 11);
        assert_eq!(
            ports
                .iter()
                .filter(|port| **port == PREFERRED_PORT + 3)
                .count(),
            1
        );
    }

    #[test]
    fn remembers_a_port() {
        let folder = tempfile::tempdir().expect("a temporary folder");
        let file = folder.path().join("loopback-port");

        assert_eq!(remembered(&file), None);

        remember(&file, 41_850).expect("remembered");

        assert_eq!(remembered(&file), Some(41_850));

        fs::write(&file, "nonsense").expect("written");

        assert_eq!(remembered(&file), None);
    }

    #[tokio::test]
    async fn moves_on_from_a_port_that_is_taken() {
        let taken = TcpListener::bind("127.0.0.1:0").await.expect("a port");
        let busy = taken.local_addr().expect("an address").port();

        let listener = listen_on_the_first(&[busy, 0]).expect("a port");
        let port = listener.local_addr().expect("an address").port();

        assert_ne!(port, busy);
        assert!(listener
            .local_addr()
            .expect("an address")
            .ip()
            .is_loopback());
    }
}
