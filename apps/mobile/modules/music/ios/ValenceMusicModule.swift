import AVFoundation
import ExpoModulesCore
import MediaPlayer
import UIKit

/// What is playing, for the lock screen and Control Centre: a song, or a chapter of a book, and the
/// stretch of the file it covers where it is only part of one.
struct ATrackDescribed: Record {
  @Field var title: String = ""
  @Field var artist: String = ""
  @Field var album: String = ""
  @Field var artwork: String? = nil
  @Field var from: Double? = nil
  @Field var lasts: Double? = nil
}

/// Plays Valence's music and audiobooks the way they play on an iPhone: on after the app is closed
/// and the phone is locked, described on the lock screen and in Control Centre, and answering their
/// buttons and a pair of headphones.
///
/// Music and books each have a speaker of their own, named by the channel every call gives, so
/// starting a book does not throw away the song that was loaded. Whichever last started playing is
/// the one the lock screen shows and answers for: a song with its skip buttons, a book with fifteen
/// seconds back, thirty on and its speed.
///
/// No queue and no chapters are kept here. The app decides what plays next, so this is only the
/// speakers: each is told what to play, and what to run on into after it, and reports what happens
/// in the same events a browser's audio element sends, and whatever the lock screen asks for is
/// passed on to decide what it means.
public class ValenceMusicModule: Module {
  private var speakers: [String: ValenceSpeaker] = [:]
  private var owner = "music"
  private var interruptionWatch: NSObjectProtocol?
  private var hasCommands = false

  public func definition() -> ModuleDefinition {
    Name("ValenceMusic")

    Events("onAudio", "onRemote")

    OnCreate {
      self.watchForInterruptions()
    }

    OnDestroy {
      self.onMain {
        self.speakers.values.forEach { $0.stop() }
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
      }
    }

    Function("load") { (channel: String, url: String, cookie: String?) in
      self.onMain {
        let speaker = self.speaker(channel)

        speaker.load(url, cookie: cookie)
        self.fetchTheArtwork(for: speaker)
      }
    }

    Function("lineUp") { (channel: String, url: String, cookie: String?) in
      self.onMain {
        self.speaker(channel).lineUp(url, cookie: cookie)
      }
    }

    Function("play") { (channel: String) in
      self.onMain {
        self.play(channel)
      }
    }

    Function("pause") { (channel: String) in
      self.onMain {
        self.speaker(channel).player.pause()
      }
    }

    Function("seek") { (channel: String, seconds: Double) in
      self.onMain {
        self.speaker(channel).seek(seconds)
      }
    }

    Function("setRate") { (channel: String, rate: Double) in
      self.onMain {
        self.speaker(channel).setRate(rate)
        self.tellTheLockScreen(about: channel)
      }
    }

    Function("setVolume") { (channel: String, volume: Double) in
      self.onMain {
        self.speaker(channel).player.volume = Float(min(max(volume, 0), 1))
      }
    }

    Function("setMuted") { (channel: String, isMuted: Bool) in
      self.onMain {
        self.speaker(channel).player.isMuted = isMuted
      }
    }

    Function("describe") { (channel: String, track: ATrackDescribed) in
      self.onMain {
        let speaker = self.speaker(channel)

        speaker.described = track
        self.tellTheLockScreen(about: channel)
        self.fetchTheArtwork(for: speaker)
      }
    }

    Function("stop") { (channel: String) in
      self.onMain {
        self.speaker(channel).stop()

        if channel == self.owner {
          MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
        }
      }
    }
  }

  /// Runs what a call asks for on the main thread, where the speakers and the lock screen are only
  /// ever touched, since a synchronous function is called on JavaScript's own.
  private func onMain(_ run: @escaping () -> Void) {
    if Thread.isMainThread {
      run()
    } else {
      DispatchQueue.main.async(execute: run)
    }
  }

  /// The speaker for a channel, made the first time the channel is used.
  private func speaker(_ channel: String) -> ValenceSpeaker {
    if let made = speakers[channel] {
      return made
    }

    let made = ValenceSpeaker(channel: channel) { [weak self] speaker, type in
      self?.heard(type, from: speaker)
    }

    speakers[channel] = made

    return made
  }

  /// Plays a channel, taking the audio session and the lock screen for it first so it carries on in
  /// the background and its buttons answer for it.
  private func play(_ channel: String) {
    let session = AVAudioSession.sharedInstance()

    try? session.setCategory(.playback, mode: .spokenAudioIfBook(channel), policy: .longFormAudio)
    try? session.setActive(true)
    owner = channel
    takeTheLockScreen()
    offerTheCommands()
    speaker(channel).play()
    tellTheLockScreen(about: channel)
  }

  /// Passes on what a speaker said, and keeps the lock screen in step with the one it shows.
  private func heard(_ type: String, from speaker: ValenceSpeaker) {
    let duration = speaker.player.currentItem?.duration.seconds ?? .nan
    let at = speaker.player.currentTime().seconds

    sendEvent("onAudio", [
      "channel": speaker.channel,
      "type": type,
      "currentTime": at.isFinite ? at : 0,
      "duration": duration.isFinite ? duration : -1,
      "paused": speaker.player.timeControlStatus == .paused,
      "source": (speaker.player.currentItem?.asset as? AVURLAsset)?.url.absoluteString ?? "",
    ])

    if type == "timeupdate" {
      keepTheSession()
    }

    if type != "timeupdate" {
      tellTheLockScreen(about: speaker.channel)
    }
  }

  /// Resumes whichever channel the lock screen answers for once a call or an alarm is over, where
  /// the system says to.
  private func watchForInterruptions() {
    interruptionWatch = NotificationCenter.default.addObserver(
      forName: AVAudioSession.interruptionNotification,
      object: nil,
      queue: .main
    ) { [weak self] note in
      guard let raw = note.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
            AVAudioSession.InterruptionType(rawValue: raw) == .ended,
            let options = note.userInfo?[AVAudioSessionInterruptionOptionKey] as? UInt,
            AVAudioSession.InterruptionOptions(rawValue: options).contains(.shouldResume),
            let self else {
        return
      }

      self.play(self.owner)
    }
  }

  /// Answers the lock screen, Control Centre and headphones by passing each on to the app, naming
  /// the channel it answers for, set up once on the main thread, since commands enabled from any
  /// other are not always honoured.
  private func takeTheLockScreen() {
    guard Thread.isMainThread else {
      DispatchQueue.main.async { [weak self] in
        self?.takeTheLockScreen()
      }

      return
    }

    guard !hasCommands else {
      return
    }

    hasCommands = true

    let commands = MPRemoteCommandCenter.shared()
    let passOn: [(MPRemoteCommand, String)] = [
      (commands.playCommand, "play"),
      (commands.pauseCommand, "pause"),
      (commands.togglePlayPauseCommand, "toggle"),
      (commands.nextTrackCommand, "next"),
      (commands.previousTrackCommand, "previous"),
    ]

    for (command, name) in passOn {
      command.addTarget { [weak self] _ in
        self?.sendEvent("onRemote", ["channel": self?.owner ?? "music", "command": name])
        return .success
      }
    }

    commands.skipBackwardCommand.preferredIntervals = [15]
    commands.skipForwardCommand.preferredIntervals = [30]

    let skips: [(MPSkipIntervalCommand, String, Double)] = [
      (commands.skipBackwardCommand, "back", 15),
      (commands.skipForwardCommand, "forward", 30),
    ]

    for (command, name, fallback) in skips {
      command.addTarget { [weak self] event in
        let seconds = (event as? MPSkipIntervalCommandEvent)?.interval ?? fallback

        self?.sendEvent(
          "onRemote",
          ["channel": self?.owner ?? "music", "command": name, "seconds": seconds]
        )
        return .success
      }
    }

    commands.changePlaybackRateCommand.supportedPlaybackRates = [0.75, 1, 1.25, 1.5, 1.75, 2]
    commands.changePlaybackRateCommand.addTarget { [weak self] event in
      guard let changed = event as? MPChangePlaybackRateCommandEvent else {
        return .commandFailed
      }

      self?.sendEvent(
        "onRemote",
        ["channel": self?.owner ?? "music", "command": "rate", "seconds": Double(changed.playbackRate)]
      )
      return .success
    }

    commands.changePlaybackPositionCommand.addTarget { [weak self] event in
      guard let moved = event as? MPChangePlaybackPositionCommandEvent else {
        return .commandFailed
      }

      self?.sendEvent(
        "onRemote",
        ["channel": self?.owner ?? "music", "command": "seek", "seconds": moved.positionTime]
      )
      return .success
    }
  }

  /// Turns on the buttons that suit what the lock screen answers for: a song's skip to the next and
  /// back, or a book's fifteen seconds back, thirty on and speed.
  private func offerTheCommands() {
    let commands = MPRemoteCommandCenter.shared()
    let isBook = owner == "book"

    commands.playCommand.isEnabled = true
    commands.pauseCommand.isEnabled = true
    commands.togglePlayPauseCommand.isEnabled = true
    commands.changePlaybackPositionCommand.isEnabled = true
    commands.nextTrackCommand.isEnabled = !isBook
    commands.previousTrackCommand.isEnabled = !isBook
    commands.skipBackwardCommand.isEnabled = isBook
    commands.skipForwardCommand.isEnabled = isBook
    commands.changePlaybackRateCommand.isEnabled = isBook
  }

  /// Takes the audio session back while something plays, where a video elsewhere in the app has
  /// since set it to mix with other audio: an app that mixes is not the one the lock screen answers
  /// to, so its buttons go grey.
  private func keepTheSession() {
    guard speakers[owner]?.player.timeControlStatus != .paused else {
      return
    }

    let session = AVAudioSession.sharedInstance()

    guard session.categoryOptions.contains(.mixWithOthers) || session.routeSharingPolicy != .longFormAudio else {
      return
    }

    try? session.setCategory(.playback, mode: .spokenAudioIfBook(owner), policy: .longFormAudio)
    try? session.setActive(true)
    offerTheCommands()
  }

  /// Puts what a channel is playing, and where it has got to, on the lock screen, where it is the
  /// channel the lock screen shows. A part of a file is shown as though it were the whole of it.
  private func tellTheLockScreen(about channel: String) {
    guard Thread.isMainThread else {
      DispatchQueue.main.async { [weak self] in
        self?.tellTheLockScreen(about: channel)
      }

      return
    }

    guard channel == owner, let speaker = speakers[channel] else {
      return
    }

    keepTheSession()
    var info = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [:]
    let duration = speaker.player.currentItem?.duration.seconds ?? .nan
    let at = speaker.player.currentTime().seconds
    let from = speaker.described.from ?? 0
    let lasts = speaker.described.lasts ?? duration

    info[MPMediaItemPropertyTitle] = speaker.described.title
    info[MPMediaItemPropertyArtist] = speaker.described.artist
    info[MPMediaItemPropertyAlbumTitle] = speaker.described.album
    info[MPMediaItemPropertyPlaybackDuration] = lasts.isFinite ? lasts : nil
    info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = at.isFinite ? max(at - from, 0) : 0
    info[MPNowPlayingInfoPropertyPlaybackRate] = speaker.isPlaying ? Double(speaker.rate) : 0.0
    info[MPNowPlayingInfoPropertyDefaultPlaybackRate] = Double(speaker.rate)
    info[MPNowPlayingInfoPropertyMediaType] = MPNowPlayingInfoMediaType.audio.rawValue
    info[MPMediaItemPropertyArtwork] = speaker.artworkFor == speaker.described.artwork
      ? speaker.artwork.map { image in MPMediaItemArtwork(boundsSize: image.size) { _ in image } }
      : nil

    MPNowPlayingInfoCenter.default().nowPlayingInfo = info
  }

  /// Fetches a speaker's artwork for the lock screen, with the same session its file came with.
  private func fetchTheArtwork(for speaker: ValenceSpeaker) {
    guard let wanted = speaker.described.artwork,
          wanted != speaker.artworkFor,
          let address = URL(string: wanted) else {
      return
    }

    var asking = URLRequest(url: address)

    if let cookie = speaker.cookie {
      asking.setValue(cookie, forHTTPHeaderField: "Cookie")
    }

    URLSession.shared.dataTask(with: asking) { [weak self, weak speaker] data, _, _ in
      guard let data, let image = UIImage(data: data) else {
        return
      }

      DispatchQueue.main.async {
        guard let self, let speaker, speaker.described.artwork == wanted else {
          return
        }

        speaker.artwork = image
        speaker.artworkFor = wanted
        self.tellTheLockScreen(about: speaker.channel)
      }
    }.resume()
  }
}

private extension AVAudioSession.Mode {
  /// Speech for a book, so the system treats it as a spoken word; the default for music.
  static func spokenAudioIfBook(_ channel: String) -> AVAudioSession.Mode {
    channel == "book" ? .spokenAudio : .default
  }
}
