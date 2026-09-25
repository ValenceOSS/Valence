import AVFoundation
import ExpoModulesCore

/// Lets iOS place a two channel soundtrack around somebody, not only six.
///
/// An `AVPlayerItem` will only be spatialised if it says it may be, and what it says by default is
/// multichannel alone — so a stereo soundtrack through AirPods reports spatial audio as
/// unavailable, which is the one thing iOS would happily have faked. Widening it is a single
/// property, and nothing in `expo-video` sets or exposes it.
///
/// Said to whatever the player is holding now and to whatever it holds next, because a player is
/// handed a new item every time the film changes and the property belongs to the item. Watching for
/// that is the only way to be sure it has been said at all: asking once, from the other side of a
/// bridge, races the thing being asked about into existence.
///
/// The player arrives as the shared reference it already is rather than as anything this has to
/// know about. `expo-video` holds an `AVPlayer` in a `SharedRef` and keeps the subclass to itself,
/// so asking for the base is asking for the only part that is ours to touch.
public class ValenceSpatialAudioModule: Module {
  private var watching: [ObjectIdentifier: NSKeyValueObservation] = [:]

  public func definition() -> ModuleDefinition {
    Name("ValenceSpatialAudio")

    Function("spatialiseEvenStereo") { (player: SharedRef<AVPlayer>) -> Bool in
      let avPlayer = player.ref

      Self.allow(on: avPlayer.currentItem)

      let key = ObjectIdentifier(avPlayer)

      if self.watching[key] == nil {
        self.watching[key] = avPlayer.observe(\.currentItem, options: [.new]) { _, change in
          Self.allow(on: change.newValue ?? nil)
        }
      }

      return avPlayer.currentItem != nil
    }
  }

  private static func allow(on item: AVPlayerItem?) {
    guard let item else {
      return
    }

    item.allowedAudioSpatializationFormats = .monoStereoAndMultichannel

    try? AVAudioSession.sharedInstance()
      .setCategory(.playback, mode: .moviePlayback, policy: .longFormVideo)
  }
}
