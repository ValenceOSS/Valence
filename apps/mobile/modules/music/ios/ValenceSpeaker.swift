import AVFoundation
import UIKit

/// One of the module's speakers: a player of its own, what it was last told to play, and how fast,
/// so a song and a book can each be loaded, paused and carried on without the other losing its
/// place.
///
/// The file to play next can be lined up behind the one playing, and the player runs straight on
/// into it without a gap, saying it has advanced rather than that the last one ended. It is lined
/// up with the volume it plays at, so a song levelled quieter than the last is turned down as it
/// starts rather than a moment after.
///
/// Where songs are to fade into each other, the last seconds of the one playing are heard from a
/// second player made ready at the place the fade starts, while the speaker itself moves on into
/// the next song and comes up as the other goes down. The speaker the lock screen reads never
/// changes, so it keeps telling and answering for whatever plays.
final class ValenceSpeaker {
  let channel: String
  let player = AVQueuePlayer()
  var described = ATrackDescribed()
  var artwork: UIImage?
  var artworkFor: String?
  var cookie: String?
  private(set) var rate: Float = 1
  private(set) var loudness: Float = 1
  private var linedLoudness: Float?
  private var linedCookie: String?
  private var crossfade: Double = 0
  private var tail: AVPlayer?
  private var tailLoudness: Float = 1
  private var fadeWatch: Any?
  private var fading: Timer?
  private var timeWatch: Any?
  private var itemWatches: [NSKeyValueObservation] = []
  private var playerWatches: [NSKeyValueObservation] = []
  private var endWatch: NSObjectProtocol?
  private var lined: AVPlayerItem?
  private let say: (ValenceSpeaker, String) -> Void

  /// Makes a speaker, which tells whoever made it what happens as it plays.
  init(channel: String, say: @escaping (ValenceSpeaker, String) -> Void) {
    self.channel = channel
    self.say = say
    player.automaticallyWaitsToMinimizeStalling = true
    player.actionAtItemEnd = .pause
    watchThePlayer()
  }

  /// Starts on a new file, forgetting the last one.
  func load(_ url: String, cookie: String?) {
    finishTheFade()
    disarmTheFade()

    guard let address = URL(string: url) else {
      say(self, "error")
      return
    }

    self.cookie = cookie

    let item = anItem(address, cookie: cookie)

    player.items().filter { $0 !== player.currentItem }.forEach { player.remove($0) }
    lined = nil
    player.actionAtItemEnd = .pause
    watch(item)
    player.replaceCurrentItem(with: item)
    say(self, "waiting")
  }

  /// Lines up the file to play once this one ends, in place of any lined up before, or none, and
  /// how loud it plays. The same file lined up again only changes how loud it plays.
  func lineUp(_ url: String, cookie: String?, volume: Double?) {
    if let lined, !url.isEmpty, (lined.asset as? AVURLAsset)?.url.absoluteString == url {
      linedLoudness = volume.map { Float(min(max($0, 0), 1)) }
      return
    }

    forgetTheLinedUp()
    disarmTheFade()
    linedLoudness = volume.map { Float(min(max($0, 0), 1)) }
    linedCookie = cookie

    guard lined == nil, let address = URL(string: url), !url.isEmpty, let playing = player.currentItem else {
      return
    }

    let item = anItem(address, cookie: cookie)

    guard player.canInsert(item, after: playing) else {
      return
    }

    player.insert(item, after: playing)
    lined = item
    player.actionAtItemEnd = .advance
    armTheFade()
  }

  /// Sets how many seconds one song fades into the next, none playing them straight on.
  func setCrossfade(_ seconds: Double) {
    crossfade = min(max(seconds, 0), 12)
    disarmTheFade()
    armTheFade()
  }

  /// Sets how loud it plays, at once unless a fade is moving it.
  func setVolume(_ volume: Double) {
    loudness = Float(min(max(volume, 0), 1))

    if fading == nil {
      player.volume = loudness
    }
  }

  /// Silences it, the fading end of the last song with it, or lets both be heard.
  func setMuted(_ isMuted: Bool) {
    player.isMuted = isMuted
    tail?.isMuted = isMuted
  }

  /// Pauses, cutting any fade short so the song before does not play on by itself.
  func pause() {
    finishTheFade()
    player.pause()
  }

  /// Makes the end of the song playing ready to fade out from a second player, and watches for the
  /// moment the fade starts — where songs fade into each other, the next is lined up, the song is
  /// long enough and has not already passed that moment.
  private func armTheFade() {
    guard crossfade > 0,
          fadeWatch == nil,
          lined != nil,
          let item = player.currentItem,
          let address = (item.asset as? AVURLAsset)?.url else {
      return
    }

    let duration = item.duration.seconds

    guard duration.isFinite, duration > 0 else {
      return
    }

    let length = min(crossfade, duration / 3)
    let start = duration - length

    guard player.currentTime().seconds < start - 0.5 else {
      return
    }

    let made = AVPlayer(playerItem: anItem(address, cookie: cookie))

    made.volume = 0
    made.isMuted = player.isMuted
    made.automaticallyWaitsToMinimizeStalling = false
    made.seek(
      to: CMTime(seconds: start, preferredTimescale: 600),
      toleranceBefore: .zero,
      toleranceAfter: .zero
    )
    tail = made
    fadeWatch = player.addBoundaryTimeObserver(
      forTimes: [NSValue(time: CMTime(seconds: start, preferredTimescale: 600))],
      queue: .main
    ) { [weak self] in
      self?.beginTheFade(over: length)
    }
  }

  /// Stops watching for a fade, and lets go of the end made ready for it.
  private func disarmTheFade() {
    if let fadeWatch {
      player.removeTimeObserver(fadeWatch)
    }

    fadeWatch = nil

    if fading == nil {
      tail?.pause()
      tail = nil
    }
  }

  /// Fades the song playing out from the second player while the speaker moves on into the next and
  /// comes up, each along a quarter of a circle so the two together stay as loud as one.
  private func beginTheFade(over length: Double) {
    if let fadeWatch {
      player.removeTimeObserver(fadeWatch)
    }

    fadeWatch = nil

    guard let tail, lined != nil, player.timeControlStatus == .playing else {
      disarmTheFade()
      return
    }

    tailLoudness = loudness
    tail.volume = tailLoudness
    tail.playImmediately(atRate: rate)
    player.volume = 0
    player.advanceToNextItem()

    let began = Date()

    fading = Timer.scheduledTimer(withTimeInterval: 0.05, repeats: true) { [weak self] _ in
      guard let self else {
        return
      }

      let along = min(Date().timeIntervalSince(began) / length, 1)

      self.player.volume = self.loudness * Float(sin(along * .pi / 2))
      self.tail?.volume = self.tailLoudness * Float(cos(along * .pi / 2))

      if along >= 1 {
        self.finishTheFade()
      }
    }
  }

  /// Ends a fade at once: the song before stops, and the one playing is heard at its own volume.
  private func finishTheFade() {
    fading?.invalidate()
    fading = nil
    tail?.pause()
    tail = nil
    player.volume = loudness
  }

  /// A file to play, asked for with the session it was given and played at its own pitch.
  private func anItem(_ address: URL, cookie: String?) -> AVPlayerItem {
    let asset = AVURLAsset(
      url: address,
      options: cookie == nil ? nil : ["AVURLAssetHTTPHeaderFieldsKey": ["Cookie": cookie ?? ""]]
    )
    let item = AVPlayerItem(asset: asset)

    item.audioTimePitchAlgorithm = .timeDomain

    return item
  }

  /// Takes back the file lined up to play next, so the one playing stops where it ends — unless the
  /// player has already run on into it, which it is about to say.
  private func forgetTheLinedUp() {
    guard let lined, lined !== player.currentItem else {
      return
    }

    player.remove(lined)
    self.lined = nil
    player.actionAtItemEnd = .pause
  }

  /// Plays, at whatever speed it was last set to.
  func play() {
    player.defaultRate = rate
    player.play()
  }

  /// Moves to a place in the file, exactly, making the fade ready again from there.
  func seek(_ seconds: Double) {
    let to = CMTime(seconds: max(seconds, 0), preferredTimescale: 600)

    finishTheFade()
    disarmTheFade()
    player.seek(to: to, toleranceBefore: .zero, toleranceAfter: .zero) { [weak self] done in
      if done, let self {
        self.say(self, "seeked")
        self.armTheFade()
      }
    }
  }

  /// Sets how fast it plays, keeping the voice at its own pitch, straight away where it is playing.
  func setRate(_ rate: Double) {
    self.rate = Float(min(max(rate, 0.5), 3))
    player.defaultRate = self.rate

    if player.timeControlStatus != .paused {
      player.rate = self.rate
    }
  }

  /// Whether it is playing now.
  var isPlaying: Bool {
    player.timeControlStatus == .playing
  }

  /// Stops, and forgets the file.
  func stop() {
    finishTheFade()
    disarmTheFade()
    player.pause()
    player.removeAllItems()
    lined = nil
    player.actionAtItemEnd = .pause
    itemWatches = []
  }

  /// Watches the player as a whole: whether it is playing, waiting or paused, and where it is.
  private func watchThePlayer() {
    timeWatch = player.addPeriodicTimeObserver(
      forInterval: CMTime(seconds: 0.5, preferredTimescale: 600),
      queue: .main
    ) { [weak self] _ in
      if let self {
        self.say(self, "timeupdate")
      }
    }

    playerWatches = [
      player.observe(\.timeControlStatus, options: [.new]) { [weak self] player, _ in
        DispatchQueue.main.async {
          guard let self else {
            return
          }

          switch player.timeControlStatus {
          case .playing:
            self.say(self, "playing")
          case .paused:
            self.say(self, "pause")
          case .waitingToPlayAtSpecifiedRate:
            self.say(self, "waiting")
          @unknown default:
            break
          }
        }
      },
      player.observe(\.currentItem, options: [.new]) { [weak self] player, _ in
        DispatchQueue.main.async {
          guard let self, let now = player.currentItem, now === self.lined else {
            return
          }

          self.lined = nil
          self.player.actionAtItemEnd = .pause
          self.cookie = self.linedCookie ?? self.cookie

          if let heard = self.linedLoudness {
            self.loudness = heard
          }

          self.linedLoudness = nil

          if self.fading == nil {
            self.player.volume = self.loudness
          }

          self.say(self, "advanced")
          self.watch(now)
        }
      },
    ]
  }

  /// Watches one file: when it is ready, how long it is, whether it failed, and when it ends. A
  /// file that runs on into the one lined up after it has not ended, it has advanced.
  private func watch(_ item: AVPlayerItem) {
    itemWatches = [
      item.observe(\.status, options: [.initial, .new]) { [weak self] item, _ in
        DispatchQueue.main.async {
          guard let self, item === self.player.currentItem else {
            return
          }

          switch item.status {
          case .readyToPlay:
            self.say(self, "loadedmetadata")
            self.say(self, "canplay")
            self.armTheFade()
          case .failed:
            self.say(self, "error")
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
    ) { [weak self, weak item] _ in
      if let self, let item, self.lined == nil, self.player.currentItem === item {
        self.say(self, "ended")
      }
    }
  }
}
