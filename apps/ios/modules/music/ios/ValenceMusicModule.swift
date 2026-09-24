import AVFoundation
import ExpoModulesCore
import MediaPlayer
import UIKit

/// What a track is called, for the lock screen and Control Centre.
struct ATrackDescribed: Record {
  @Field var title: String = ""
  @Field var artist: String = ""
  @Field var album: String = ""
  @Field var artwork: String? = nil
}

/// Plays Valence's music the way music plays on an iPhone: on after the app is closed and the phone
/// is locked, described on the lock screen and in Control Centre, and answering their buttons and
/// a pair of headphones.
///
/// The queue is not kept here. The app decides what plays next, so this is only the speaker: it is
/// told what to play and reports what happens, in the same events a browser's audio element sends,
/// and passes on whatever the lock screen asks for so the app can decide what that means.
public class ValenceMusicModule: Module {
  private let player = AVPlayer()
  private var timeWatch: Any?
  private var itemWatches: [NSKeyValueObservation] = []
  private var playerWatches: [NSKeyValueObservation] = []
  private var endWatch: NSObjectProtocol?
  private var interruptionWatch: NSObjectProtocol?
  private var described = ATrackDescribed()
  private var artworkFor: String?
  private var cookie: String?
  private var hasCommands = false

  public func definition() -> ModuleDefinition {
    Name("ValenceMusic")

    Events("onAudio", "onRemote")

    OnCreate {
      self.player.automaticallyWaitsToMinimizeStalling = true
      self.watchThePlayer()
    }

    OnDestroy {
      self.stopEverything()
    }

    Function("load") { (url: String, cookie: String?) in
      self.load(url, cookie: cookie)
    }

    Function("play") {
      self.play()
    }

    Function("pause") {
      self.player.pause()
    }

    Function("seek") { (seconds: Double) in
      let to = CMTime(seconds: max(seconds, 0), preferredTimescale: 600)

      self.player.seek(to: to, toleranceBefore: .zero, toleranceAfter: .zero) { [weak self] done in
        if done {
          self?.send("seeked")
          self?.tellTheLockScreen()
        }
      }
    }

    Function("setVolume") { (volume: Double) in
      self.player.volume = Float(min(max(volume, 0), 1))
    }

    Function("setMuted") { (isMuted: Bool) in
      self.player.isMuted = isMuted
    }

    Function("describe") { (track: ATrackDescribed) in
      self.described = track
      self.tellTheLockScreen()
      self.fetchTheArtwork()
    }

    Function("stop") {
      self.stopEverything()
    }
  }

  /// Starts on a new track, forgetting the last one.
  private func load(_ url: String, cookie: String?) {
    guard let address = URL(string: url) else {
      send("error")
      return
    }

    self.cookie = cookie

    let asset = AVURLAsset(
      url: address,
      options: cookie == nil ? nil : ["AVURLAssetHTTPHeaderFieldsKey": ["Cookie": cookie ?? ""]]
    )
    let item = AVPlayerItem(asset: asset)

    watch(item)
    player.replaceCurrentItem(with: item)
    send("waiting")
  }

  /// Plays, taking the audio session first so it carries on in the background.
  private func play() {
    let session = AVAudioSession.sharedInstance()

    try? session.setCategory(.playback, mode: .default, policy: .longFormAudio)
    try? session.setActive(true)
    takeTheLockScreen()
    player.play()
  }

  /// Watches the player as a whole: whether it is playing, waiting or paused, and where it is.
  private func watchThePlayer() {
    timeWatch = player.addPeriodicTimeObserver(
      forInterval: CMTime(seconds: 0.5, preferredTimescale: 600),
      queue: .main
    ) { [weak self] _ in
      self?.send("timeupdate")
      self?.keepTheSession()
    }

    playerWatches = [
      player.observe(\.timeControlStatus, options: [.new]) { [weak self] player, _ in
        DispatchQueue.main.async {
          switch player.timeControlStatus {
          case .playing:
            self?.send("playing")
          case .paused:
            self?.send("pause")
          case .waitingToPlayAtSpecifiedRate:
            self?.send("waiting")
          @unknown default:
            break
          }

          self?.tellTheLockScreen()
        }
      },
    ]

    interruptionWatch = NotificationCenter.default.addObserver(
      forName: AVAudioSession.interruptionNotification,
      object: nil,
      queue: .main
    ) { [weak self] note in
      guard let raw = note.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
            AVAudioSession.InterruptionType(rawValue: raw) == .ended,
            let options = note.userInfo?[AVAudioSessionInterruptionOptionKey] as? UInt,
            AVAudioSession.InterruptionOptions(rawValue: options).contains(.shouldResume) else {
        return
      }

      self?.play()
    }
  }

  /// Watches one track: when it is ready, how long it is, whether it failed, and when it ends.
  private func watch(_ item: AVPlayerItem) {
    itemWatches = [
      item.observe(\.status, options: [.new]) { [weak self] item, _ in
        DispatchQueue.main.async {
          switch item.status {
          case .readyToPlay:
            self?.send("loadedmetadata")
            self?.send("canplay")
            self?.tellTheLockScreen()
          case .failed:
            self?.send("error")
          default:
            break
          }
        }
      },
    ]

    if let endWatch {
      NotificationCenter.default.removeObserver(endWatch)
    }

    endWatch = NotificationCenter.default.addObserver(
      forName: .AVPlayerItemDidPlayToEndTime,
      object: item,
      queue: .main
    ) { [weak self] _ in
      self?.send("ended")
    }
  }

  /// Tells the app what just happened, with where the player is.
  private func send(_ type: String) {
    let duration = player.currentItem?.duration.seconds ?? .nan

    sendEvent("onAudio", [
      "type": type,
      "currentTime": player.currentTime().seconds.isFinite ? player.currentTime().seconds : 0,
      "duration": duration.isFinite ? duration : -1,
      "paused": player.timeControlStatus == .paused,
    ])
  }

  /// Answers the lock screen, Control Centre and headphones by passing each on to the app, set up on
  /// the main thread, since commands enabled from any other are not always honoured.
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
      command.isEnabled = true
      command.addTarget { [weak self] _ in
        self?.sendEvent("onRemote", ["command": name])
        return .success
      }
    }

    commands.changePlaybackPositionCommand.isEnabled = true
    commands.changePlaybackPositionCommand.addTarget { [weak self] event in
      guard let moved = event as? MPChangePlaybackPositionCommandEvent else {
        return .commandFailed
      }

      self?.sendEvent("onRemote", ["command": "seek", "seconds": moved.positionTime])
      return .success
    }
  }

  /// Takes the audio session back while music plays, where a video elsewhere in the app has since
  /// set it to mix with other audio: an app that mixes is not the one the lock screen answers to, so
  /// its skip buttons go grey.
  private func keepTheSession() {
    guard player.timeControlStatus != .paused else {
      return
    }

    let session = AVAudioSession.sharedInstance()

    guard session.categoryOptions.contains(.mixWithOthers) || session.routeSharingPolicy != .longFormAudio else {
      return
    }

    try? session.setCategory(.playback, mode: .default, policy: .longFormAudio)
    try? session.setActive(true)

    let commands = MPRemoteCommandCenter.shared()

    commands.nextTrackCommand.isEnabled = true
    commands.previousTrackCommand.isEnabled = true
  }

  /// Puts what is playing, and where it has got to, on the lock screen.
  private func tellTheLockScreen() {
    guard Thread.isMainThread else {
      DispatchQueue.main.async { [weak self] in
        self?.tellTheLockScreen()
      }

      return
    }

    keepTheSession()
    var info = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [:]
    let duration = player.currentItem?.duration.seconds ?? .nan
    let at = player.currentTime().seconds

    info[MPMediaItemPropertyTitle] = described.title
    info[MPMediaItemPropertyArtist] = described.artist
    info[MPMediaItemPropertyAlbumTitle] = described.album
    info[MPMediaItemPropertyPlaybackDuration] = duration.isFinite ? duration : nil
    info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = at.isFinite ? at : 0
    info[MPNowPlayingInfoPropertyPlaybackRate] = player.timeControlStatus == .playing ? 1.0 : 0.0
    info[MPNowPlayingInfoPropertyMediaType] = MPNowPlayingInfoMediaType.audio.rawValue

    if artworkFor != described.artwork {
      info[MPMediaItemPropertyArtwork] = nil
    }

    MPNowPlayingInfoCenter.default().nowPlayingInfo = info
  }

  /// Fetches the album's artwork for the lock screen, with the same session the track came with.
  private func fetchTheArtwork() {
    guard let wanted = described.artwork, let address = URL(string: wanted) else {
      return
    }

    var asking = URLRequest(url: address)

    if let cookie {
      asking.setValue(cookie, forHTTPHeaderField: "Cookie")
    }

    URLSession.shared.dataTask(with: asking) { [weak self] data, _, _ in
      guard let data, let image = UIImage(data: data) else {
        return
      }

      DispatchQueue.main.async {
        guard let self, self.described.artwork == wanted else {
          return
        }

        var info = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [:]

        info[MPMediaItemPropertyArtwork] = MPMediaItemArtwork(boundsSize: image.size) { _ in image }
        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
        self.artworkFor = wanted
      }
    }.resume()
  }

  /// Stops playing, and takes Valence off the lock screen.
  private func stopEverything() {
    player.pause()
    player.replaceCurrentItem(with: nil)
    itemWatches = []
    MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
  }
}
