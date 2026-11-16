//! Saying what somebody is watching in their Discord status, where Discord is running.
//!
//! It is a socket the Discord client opens on the same machine — a named pipe on Windows, a Unix
//! socket everywhere else. Nothing here is required to work: Discord is not running for most people
//! most of the time, the socket may be any of ten, and it goes away when Discord quits. Every
//! failure is quiet and recoverable: the connection is dropped, and the next thing somebody plays
//! tries again from the beginning.
//!
//! A status identical to the last one sent is not sent again, and changes are spaced four seconds
//! apart with whatever is true at the end of the wait being what goes, since Discord quietly drops
//! what goes over its allowance. Only one connection is tried at a time.

use crate::discord::activity::{a_discord_activity, Build};
use crate::discord::frame::{a_discord_frame, read_discord_frames, FRAME, HANDSHAKE};
use crate::discord::what_is_playing::WhatIsPlaying;
use futures_util::future::BoxFuture;
use serde::Serialize;
use std::sync::Arc;
use std::time::{Duration, SystemTime};
use tokio::io::{AsyncRead, AsyncReadExt, AsyncWrite, AsyncWriteExt};
use tokio::runtime::Handle;
use tokio::sync::{mpsc, oneshot};
use tokio::time::Instant;

/// Valence's application on Discord.
const CLIENT_ID: &str = "1539800715281563738";

/// The version of Discord's protocol spoken.
const VERSION: u8 = 1;

/// How far apart changes are sent.
const SPACED_BY: Duration = Duration::from_secs(4);

/// How long a write may take before the connection is given up on.
const LONG_ENOUGH_TO_WRITE: Duration = Duration::from_secs(2);

/// A connection to Discord.
pub trait Connection: AsyncRead + AsyncWrite + Send + Unpin {}

impl<T: AsyncRead + AsyncWrite + Send + Unpin> Connection for T {}

/// Opens a connection to Discord at one of the places it might be listening.
pub type Connector =
    Arc<dyn Fn(String) -> BoxFuture<'static, std::io::Result<Box<dyn Connection>>> + Send + Sync>;

/// What the page has said, for the one task that talks to Discord.
enum Said {
    About(Option<WhatIsPlaying>),
    Close(oneshot::Sender<()>),
}

/// Where the status is published.
#[derive(Clone)]
pub struct Presence {
    saying: mpsc::UnboundedSender<Said>,
}

impl Presence {
    /// Says what is playing now, or that nothing is.
    pub fn about(&self, playing: Option<WhatIsPlaying>) {
        let _ = self.saying.send(Said::About(playing));
    }

    /// Takes the status down straight away and lets go of Discord.
    pub async fn close(&self) {
        let (closed, closing) = oneshot::channel();

        if self.saying.send(Said::Close(closed)).is_ok() {
            let _ = closing.await;
        }
    }
}

/// The handshake that says who is talking.
#[derive(Serialize)]
struct Handshake {
    v: u8,
    client_id: &'static str,
}

/// A change of status.
#[derive(Serialize)]
struct SetActivity<'a> {
    cmd: &'static str,
    nonce: String,
    args: Arguments<'a>,
}

/// What a change of status carries.
#[derive(Serialize)]
struct Arguments<'a> {
    pid: u32,
    activity: &'a serde_json::Value,
}

/// Everything the task talking to Discord keeps.
struct Talking {
    paths: Vec<String>,
    connector: Connector,
    opened_at: i64,
    build: Option<Build>,
    socket: Option<Box<dyn Connection>>,
    is_ready: bool,
    waiting: Option<WhatIsPlaying>,
    arrived: Vec<u8>,
    last_sent: Option<String>,
    last_sent_at: Option<Instant>,
    held: Option<Instant>,
    connecting: Option<oneshot::Receiver<Option<Box<dyn Connection>>>>,
}

/// Now, in milliseconds since the epoch.
fn milliseconds_now() -> u128 {
    SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis()
}

impl Talking {
    /// Writes a message, and lets go of a connection that will not take it.
    async fn send(&mut self, opcode: i32, payload: &impl Serialize) {
        let Ok(said) = serde_json::to_string(payload) else {
            return;
        };
        let Some(socket) = self.socket.as_mut() else {
            return;
        };
        let framed = a_discord_frame(opcode, &said);
        let written = tokio::time::timeout(LONG_ENOUGH_TO_WRITE, socket.write_all(&framed)).await;

        if !matches!(written, Ok(Ok(()))) {
            self.forget();
        }
    }

    /// Sends a status, unless it is the last one sent or it is too soon after it.
    async fn set_activity(&mut self, playing: Option<WhatIsPlaying>, is_urgent: bool) {
        let activity = serde_json::to_value(a_discord_activity(
            playing.as_ref(),
            self.opened_at,
            self.build.as_ref(),
        ))
        .unwrap_or(serde_json::Value::Null);
        let said = activity.to_string();

        if self.last_sent.as_ref() == Some(&said) {
            return;
        }

        let now = Instant::now();
        let free_at = self.last_sent_at.map(|sent| sent + SPACED_BY);

        if let Some(free_at) = free_at.filter(|free_at| *free_at > now && !is_urgent) {
            self.held.get_or_insert(free_at);

            return;
        }

        self.last_sent = Some(said);
        self.last_sent_at = Some(now);

        self.send(
            FRAME,
            &SetActivity {
                cmd: "SET_ACTIVITY",
                nonce: milliseconds_now().to_string(),
                args: Arguments {
                    pid: std::process::id(),
                    activity: &activity,
                },
            },
        )
        .await;
    }

    /// Lets go of the connection and everything said over it.
    fn forget(&mut self) {
        self.held = None;
        self.socket = None;
        self.is_ready = false;
        self.arrived.clear();
        self.last_sent = None;
        self.last_sent_at = None;
    }

    /// Reads what Discord sent, and sends what is waiting once Discord says it is ready.
    async fn heard(&mut self, chunk: &[u8]) {
        self.arrived.extend_from_slice(chunk);

        let read = read_discord_frames(&self.arrived);

        if read.is_broken {
            self.forget();

            return;
        }

        self.arrived = read.rest;

        let is_ready_now = read.frames.iter().any(|frame| frame.opcode != HANDSHAKE);

        if is_ready_now && !self.is_ready {
            self.is_ready = true;

            if self.waiting.is_some() {
                self.set_activity(self.waiting.clone(), false).await;
            }
        }
    }

    /// Tries each place Discord might be listening in turn, one at a time, in the background.
    fn connect(&mut self) {
        let (connected, connecting) = oneshot::channel();
        let paths = self.paths.clone();
        let connector = Arc::clone(&self.connector);

        self.connecting = Some(connecting);

        tokio::spawn(async move {
            for path in paths {
                if let Ok(connection) = connector(path).await {
                    let _ = connected.send(Some(connection));

                    return;
                }
            }

            let _ = connected.send(None);
        });
    }

    /// Takes a connection that opened, and says who is talking.
    async fn connected(&mut self, connection: Option<Box<dyn Connection>>) {
        self.connecting = None;

        if let Some(connection) = connection {
            self.socket = Some(connection);
            self.send(
                HANDSHAKE,
                &Handshake {
                    v: VERSION,
                    client_id: CLIENT_ID,
                },
            )
            .await;
        }
    }

    /// Hears what the page said.
    async fn about(&mut self, playing: Option<WhatIsPlaying>) {
        self.waiting.clone_from(&playing);

        if self.socket.is_none() {
            if playing.is_some() && self.connecting.is_none() {
                self.connect();
            }

            return;
        }

        if self.is_ready {
            self.set_activity(playing, false).await;
        }
    }

    /// Sends what is true now, once the wait is over.
    async fn waited(&mut self) {
        self.held = None;

        if self.is_ready {
            self.set_activity(self.waiting.clone(), false).await;
        }
    }

    /// Takes the status down straight away, and lets go.
    async fn close(&mut self) {
        if self.is_ready {
            self.set_activity(None, true).await;
        }

        self.forget();
    }
}

/// Waits for whatever the socket says next, or for ever where there is no socket.
async fn next_from(
    socket: Option<&mut Box<dyn Connection>>,
    chunk: &mut [u8],
) -> std::io::Result<usize> {
    match socket {
        Some(socket) => socket.read(chunk).await,
        None => std::future::pending().await,
    }
}

/// Waits for a connection being tried, or for ever where none is.
async fn next_connection(
    connecting: Option<&mut oneshot::Receiver<Option<Box<dyn Connection>>>>,
) -> Option<Box<dyn Connection>> {
    match connecting {
        Some(connecting) => connecting.await.ok().flatten(),
        None => std::future::pending().await,
    }
}

/// Waits until a held status may go, or for ever where none is held.
async fn until(held: Option<Instant>) {
    match held {
        Some(at) => tokio::time::sleep_until(at).await,
        None => std::future::pending().await,
    }
}

/// Starts saying what is playing in somebody's Discord status, on the given runtime.
///
/// `opened_at` is when Valence opened, in milliseconds, which browsing counts from; `build` is
/// which Valence is saying so, whose version the status names.
pub fn tell_discord(
    paths: Vec<String>,
    connector: Connector,
    opened_at: i64,
    build: Option<Build>,
    runtime: &Handle,
) -> Presence {
    let (saying, mut said) = mpsc::unbounded_channel();
    let mut talking = Talking {
        paths,
        connector,
        opened_at,
        build,
        socket: None,
        is_ready: false,
        waiting: None,
        arrived: Vec::new(),
        last_sent: None,
        last_sent_at: None,
        held: None,
        connecting: None,
    };

    runtime.spawn(async move {
        let mut chunk = vec![0_u8; 8192];

        loop {
            tokio::select! {
                next = said.recv() => match next {
                    Some(Said::About(playing)) => talking.about(playing).await,
                    Some(Said::Close(closed)) => {
                        talking.close().await;
                        let _ = closed.send(());
                    }
                    None => break,
                },
                connection = next_connection(talking.connecting.as_mut()) => {
                    talking.connected(connection).await;
                }
                read = next_from(talking.socket.as_mut(), &mut chunk) => match read {
                    Ok(0) | Err(_) => talking.forget(),
                    Ok(read) => {
                        let heard = chunk[..read].to_vec();

                        talking.heard(&heard).await;
                    }
                },
                () = until(talking.held) => talking.waited().await,
            }
        }
    });

    Presence { saying }
}

#[cfg(test)]
mod tests {
    use super::{tell_discord, Connection, Connector, Presence};
    use crate::discord::activity::Build;
    use crate::discord::frame::{a_discord_frame, read_discord_frames, FRAME};
    use crate::discord::what_is_playing::{what_is_playing, WhatIsPlaying};
    use futures_util::FutureExt;
    use serde_json::json;
    use std::collections::VecDeque;
    use std::pin::Pin;
    use std::sync::atomic::{AtomicBool, Ordering};
    use std::sync::{Arc, Mutex};
    use std::task::{Context, Poll};
    use std::time::Duration;
    use tokio::io::AsyncWrite;
    use tokio::runtime::Handle;
    use tokio::sync::{mpsc, oneshot};

    const OPENED: i64 = 1_755_000_000_000;

    struct Recorder {
        written: Arc<Mutex<Vec<u8>>>,
        is_destroyed: Arc<AtomicBool>,
    }

    impl AsyncWrite for Recorder {
        fn poll_write(
            self: Pin<&mut Self>,
            _: &mut Context<'_>,
            chunk: &[u8],
        ) -> Poll<std::io::Result<usize>> {
            if let Ok(mut written) = self.written.lock() {
                written.extend_from_slice(chunk);
            }

            Poll::Ready(Ok(chunk.len()))
        }

        fn poll_flush(self: Pin<&mut Self>, _: &mut Context<'_>) -> Poll<std::io::Result<()>> {
            Poll::Ready(Ok(()))
        }

        fn poll_shutdown(self: Pin<&mut Self>, _: &mut Context<'_>) -> Poll<std::io::Result<()>> {
            Poll::Ready(Ok(()))
        }
    }

    impl Drop for Recorder {
        fn drop(&mut self) {
            self.is_destroyed.store(true, Ordering::SeqCst);
        }
    }

    struct AFakeSocket {
        written: Arc<Mutex<Vec<u8>>>,
        is_destroyed: Arc<AtomicBool>,
        discord_says: Option<mpsc::UnboundedSender<std::io::Result<VecDeque<u8>>>>,
        connect: Option<oneshot::Sender<()>>,
    }

    impl AFakeSocket {
        fn says(&self, bytes: Vec<u8>) {
            if let Some(discord_says) = &self.discord_says {
                let _ = discord_says.send(Ok(VecDeque::from(bytes)));
            }
        }

        fn statuses_sent(&self) -> usize {
            self.frames()
                .iter()
                .filter(|payload| payload.contains("SET_ACTIVITY"))
                .count()
        }

        fn last_status(&self) -> String {
            self.frames().last().cloned().unwrap_or_default()
        }

        fn frames(&self) -> Vec<String> {
            let written = self
                .written
                .lock()
                .map(|said| said.clone())
                .unwrap_or_default();

            read_discord_frames(&written)
                .frames
                .into_iter()
                .map(|frame| frame.payload)
                .collect()
        }

        fn is_destroyed(&self) -> bool {
            self.is_destroyed.load(Ordering::SeqCst)
        }
    }

    #[derive(Clone, Default)]
    struct Sockets {
        made: Arc<Mutex<Vec<AFakeSocket>>>,
    }

    impl Sockets {
        fn connector(&self) -> Connector {
            let made = Arc::clone(&self.made);

            Arc::new(move |_| {
                let written = Arc::new(Mutex::new(Vec::new()));
                let is_destroyed = Arc::new(AtomicBool::new(false));
                let (discord_says, heard) = mpsc::unbounded_channel();
                let (connect, connected) = oneshot::channel();
                let reader = tokio_util::io::StreamReader::new(Box::pin(
                    futures_util::stream::unfold(heard, |mut heard| async move {
                        heard.recv().await.map(|said| (said, heard))
                    }),
                ));
                let writer = Recorder {
                    written: Arc::clone(&written),
                    is_destroyed: Arc::clone(&is_destroyed),
                };

                if let Ok(mut made) = made.lock() {
                    made.push(AFakeSocket {
                        written,
                        is_destroyed,
                        discord_says: Some(discord_says),
                        connect: Some(connect),
                    });
                }

                async move {
                    let _ = connected.await;
                    let connection: Box<dyn Connection> = Box::new(tokio::io::join(reader, writer));

                    Ok(connection)
                }
                .boxed()
            })
        }

        fn made(&self) -> usize {
            self.made.lock().map(|made| made.len()).unwrap_or_default()
        }

        fn with_last<T>(&self, then: impl FnOnce(&mut AFakeSocket) -> T) -> T {
            let mut made = self
                .made
                .lock()
                .unwrap_or_else(|_| panic!("the sockets were poisoned"));
            let last = made
                .last_mut()
                .unwrap_or_else(|| panic!("nothing tried to connect"));

            then(last)
        }

        async fn ready_to_talk(&self) {
            self.with_last(|socket| {
                if let Some(connect) = socket.connect.take() {
                    let _ = connect.send(());
                }
            });
            settle().await;
            self.with_last(|socket| {
                socket.says(a_discord_frame(
                    FRAME,
                    &json!({ "evt": "READY" }).to_string(),
                ));
            });
            settle().await;
        }
    }

    async fn settle() {
        for _ in 0..50 {
            tokio::task::yield_now().await;
        }
    }

    fn browsing(logo: &str) -> Option<WhatIsPlaying> {
        what_is_playing(&json!({ "kind": "browsing", "look": { "logo": logo } }))
    }

    fn talking(sockets: &Sockets, build: Option<Build>) -> Presence {
        tell_discord(
            vec!["/tmp/discord-ipc-0".to_owned()],
            sockets.connector(),
            OPENED,
            build,
            &Handle::current(),
        )
    }

    async fn wait(milliseconds: u64) {
        tokio::time::advance(Duration::from_millis(milliseconds)).await;
        settle().await;
    }

    #[tokio::test(start_paused = true)]
    async fn sends_a_status_that_has_changed_and_not_one_that_is_the_same_as_the_last() {
        let sockets = Sockets::default();
        let discord = talking(&sockets, None);

        discord.about(browsing("light"));
        settle().await;
        sockets.ready_to_talk().await;
        discord.about(browsing("light"));
        discord.about(browsing("light"));
        settle().await;

        assert_eq!(sockets.with_last(|socket| socket.statuses_sent()), 1);

        discord.about(browsing("dark"));
        wait(4000).await;
        discord.about(None);
        wait(4000).await;

        assert_eq!(sockets.with_last(|socket| socket.statuses_sent()), 3);
    }

    #[tokio::test(start_paused = true)]
    async fn holds_a_burst_of_changes_and_sends_only_the_last() {
        let sockets = Sockets::default();
        let discord = talking(&sockets, None);

        discord.about(browsing("light"));
        settle().await;
        sockets.ready_to_talk().await;
        discord.about(browsing("dark"));
        discord.about(browsing("light"));
        discord.about(browsing("dark"));
        settle().await;

        assert_eq!(sockets.with_last(|socket| socket.statuses_sent()), 1);

        wait(4000).await;

        assert_eq!(sockets.with_last(|socket| socket.statuses_sent()), 2);
        assert!(sockets.with_last(|socket| socket.last_status().contains("valence-desktop-dark")));
    }

    #[tokio::test(start_paused = true)]
    async fn tries_one_connection_at_a_time_however_many_changes_arrive() {
        let sockets = Sockets::default();
        let discord = talking(&sockets, None);

        discord.about(browsing("light"));
        discord.about(browsing("dark"));
        discord.about(browsing("light"));
        settle().await;

        assert_eq!(sockets.made(), 1);
    }

    #[tokio::test(start_paused = true)]
    async fn wears_the_dev_logo_for_a_build_still_being_worked_on() {
        let sockets = Sockets::default();
        let discord = talking(
            &sockets,
            Some(Build {
                version: "0.0.0".to_owned(),
                is_a_dev_build: true,
            }),
        );

        discord.about(browsing("light"));
        settle().await;
        sockets.ready_to_talk().await;

        let said = sockets.with_last(|socket| socket.last_status());

        assert!(said.contains(r#""large_image":"valence-desktop-dev""#));
        assert!(said.contains(r#""large_text":"Valence 0.0.0""#));
    }

    #[tokio::test(start_paused = true)]
    async fn clears_the_status_straight_away_when_the_window_closes() {
        let sockets = Sockets::default();
        let discord = talking(&sockets, None);

        discord.about(browsing("light"));
        settle().await;
        sockets.ready_to_talk().await;
        discord.close().await;

        assert_eq!(sockets.with_last(|socket| socket.statuses_sent()), 2);
        assert!(sockets.with_last(|socket| socket.last_status().contains(r#""activity":null"#)));
    }

    #[tokio::test(start_paused = true)]
    async fn sends_the_status_again_over_a_new_connection_where_discord_has_forgotten_it() {
        let sockets = Sockets::default();
        let discord = talking(&sockets, None);

        discord.about(browsing("light"));
        settle().await;
        sockets.ready_to_talk().await;
        sockets.with_last(|socket| socket.discord_says = None);
        settle().await;
        discord.about(browsing("light"));
        settle().await;
        sockets.ready_to_talk().await;

        assert_eq!(sockets.made(), 2);
        assert_eq!(sockets.with_last(|socket| socket.statuses_sent()), 1);
    }

    #[tokio::test(start_paused = true)]
    async fn drops_a_connection_whose_peer_sends_a_length_no_message_has() {
        let sockets = Sockets::default();
        let discord = talking(&sockets, None);

        discord.about(browsing("light"));
        settle().await;
        sockets.ready_to_talk().await;

        let mut nonsense = FRAME.to_le_bytes().to_vec();

        nonsense.extend_from_slice(&(-8_i32).to_le_bytes());
        nonsense.extend_from_slice(&[0; 8]);
        sockets.with_last(|socket| socket.says(nonsense));
        settle().await;

        assert!(sockets.with_last(|socket| socket.is_destroyed()));
    }
}
