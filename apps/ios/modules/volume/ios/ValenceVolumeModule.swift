import AVFoundation
import ExpoModulesCore
import MediaPlayer

/// The phone's volume, for a slider drawn like the rest of the player.
///
/// iOS only lets an app set the volume through the system's own slider, so a
/// hidden `MPVolumeView` is kept on screen and its slider is moved on our
/// behalf. Keeping one on screen also stops iOS drawing its volume box over the
/// player when the buttons on the side of the phone are pressed. The volume is
/// read from the audio session, and watched there so the slider follows those
/// buttons.
public class ValenceVolumeModule: Module {
  private var watching: NSKeyValueObservation?

  public func definition() -> ModuleDefinition {
    Name("ValenceVolume")

    Events("onVolume")

    Function("now") { () -> Float in
      AVAudioSession.sharedInstance().outputVolume
    }

    AsyncFunction("set") { (to: Float) in
      ValenceVolumeView.setVolume(to)
    }.runOnQueue(.main)

    OnStartObserving {
      self.watching = AVAudioSession.sharedInstance().observe(\.outputVolume, options: [.new]) {
        [weak self] session, _ in
        self?.sendEvent("onVolume", ["volume": session.outputVolume])
      }
    }

    OnStopObserving {
      self.watching?.invalidate()
      self.watching = nil
    }

    View(ValenceVolumeView.self) {}
  }
}

/// Holds the system's volume slider, all but invisible.
public class ValenceVolumeView: ExpoView {
  private static weak var shown: ValenceVolumeView?

  private let volume = MPVolumeView()

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)

    isUserInteractionEnabled = false
    volume.alpha = 0.01
    addSubview(volume)
    ValenceVolumeView.shown = self
  }

  public override func didMoveToWindow() {
    super.didMoveToWindow()

    if window != nil {
      ValenceVolumeView.shown = self
    }
  }

  public override func layoutSubviews() {
    super.layoutSubviews()

    volume.frame = bounds
  }

  /// Moves the system's slider, which sets the volume of whatever is playing.
  static func setVolume(_ to: Float) {
    guard let slider = shown?.volume.subviews.compactMap({ $0 as? UISlider }).first else {
      return
    }

    slider.setValue(min(max(to, 0), 1), animated: false)
    slider.sendActions(for: .valueChanged)
  }
}
