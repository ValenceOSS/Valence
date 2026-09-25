import AVFoundation
import UIKit

/// One of the module's speakers: a player of its own, what it was last told to play, and how fast,
/// so a song and a book can each be loaded, paused and carried on without the other losing its
/// place.
final class ValenceSpeaker {
  let channel: String
  let player = AVPlayer()
  var described = ATrackDescribed()
  var artwork: UIImage?
  var artworkFor: String?
  var cookie: String?
  private(set) var rate: Float = 1
  private var timeWatch: Any?
  private var itemWatches: [NSKeyValueObservation] = []
  private var playerWatches: [NSKeyValueObservation] = []
  private var endWatch: NSObjectProtocol?
  private let say: (ValenceSpeaker, String) -> Void

  /// Makes a speaker, which tells whoever made it what happens as it plays.
  init(channel: String, say: @escaping (ValenceSpeaker, String) -> Void) {
    self.channel = channel
    self.say = say
    player.automaticallyWaitsToMinimizeStalling = true
    watchThePlayer()
  }

  /// Starts on a new file, forgetting the last one.
  func load(_ url: String, cookie: String?) {
    guard let address = URL(string: url) else {
      say(self, "error")
      return
    }

    self.cookie = cookie

    let asset = AVURLAsset(
      url: address,
      options: cookie == nil ? nil : ["AVURLAssetHTTPHeaderFieldsKey": ["Cookie": cookie ?? ""]]
    )
    let item = AVPlayerItem(asset: asset)

    item.audioTimePitchAlgorithm = .timeDomain
    watch(item)
    player.replaceCurrentItem(with: item)
    say(self, "waiting")
  }

  /// Plays, at whatever speed it was last set to.
  func play() {
    player.defaultRate = rate
    player.play()
  }

  /// Moves to a place in the file, exactly.
  func seek(_ seconds: Double) {
    let to = CMTime(seconds: max(seconds, 0), preferredTimescale: 600)

    player.seek(to: to, toleranceBefore: .zero, toleranceAfter: .zero) { [weak self] done in
      if done, let self {
        self.say(self, "seeked")
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
    player.pause()
    player.replaceCurrentItem(with: nil)
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
    ]
  }

  /// Watches one file: when it is ready, how long it is, whether it failed, and when it ends.
  private func watch(_ item: AVPlayerItem) {
    itemWatches = [
      item.observe(\.status, options: [.new]) { [weak self] item, _ in
        DispatchQueue.main.async {
          guard let self else {
            return
          }

          switch item.status {
          case .readyToPlay:
            self.say(self, "loadedmetadata")
            self.say(self, "canplay")
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
    ) { [weak self] _ in
      if let self {
        self.say(self, "ended")
      }
    }
  }
}
