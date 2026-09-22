import AVFoundation
import ExpoModulesCore

/// Lets iOS place two channels around somebody, not only six.
///
/// An `AVPlayerItem` will only be spatialised if it says it may be, and what it says by default is
/// multichannel alone — so a stereo soundtrack through AirPods reports spatial audio as
/// unavailable, which is the one thing iOS would happily have faked. Widening it is a single
/// property, and nothing in `expo-video` sets or exposes it.
///
/// The player arrives as the shared reference it already is rather than as anything this has to
/// know about. `expo-video` holds an `AVPlayer` in a `SharedRef` and keeps the subclass to itself,
/// so asking for the base is asking for the only part that is ours to touch.
public class ValenceSpatialAudioModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ValenceSpatialAudio")

    Function("spatialiseEvenStereo") { (player: SharedRef<AVPlayer>) -> Bool in
      guard let item = player.ref.currentItem else {
        return false
      }

      item.allowedAudioSpatializationFormats = .monoStereoAndMultichannel

      return true
    }
  }
}
