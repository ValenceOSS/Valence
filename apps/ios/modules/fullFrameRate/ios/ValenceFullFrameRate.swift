import ExpoModulesCore
import QuartzCore

/// Has React Native's animations run at the full frame rate of a ProMotion
/// screen rather than 60 frames a second.
///
/// A display link on an iPhone ticks at 60 unless it asks for more, even with
/// `CADisableMinimumFrameDurationOnPhone` set, and the one React Native's
/// native animation driver moves things by never asks. Its core comes
/// precompiled, so it cannot be changed where it is made; instead, before the
/// app finishes launching, making a display link is swapped for a version that
/// asks for 120 on behalf of that one alone. It only ticks while something is
/// moving, so nothing that never stops — the drifting lights behind a page —
/// may be run by it, or the phone never rests. The JavaScript thread's frames
/// are left at 60. A screen without ProMotion, or a phone in Low Power Mode,
/// still gives what it can.
public final class ValenceFullFrameRate: ExpoAppDelegateSubscriber {
  public func application(
    _ application: UIApplication,
    willFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    CADisplayLink.asksForTheFullFrameRateForAnimations()

    return true
  }
}

extension CADisplayLink {
  private static var isAsking = false

  /// Swaps making a display link for the version that asks for the full frame rate, once.
  static func asksForTheFullFrameRateForAnimations() {
    guard
      !isAsking,
      let made = class_getClassMethod(
        CADisplayLink.self, NSSelectorFromString("displayLinkWithTarget:selector:")),
      let asking = class_getClassMethod(
        CADisplayLink.self, #selector(CADisplayLink.valenceDisplayLink(withTarget:selector:)))
    else {
      return
    }

    isAsking = true
    method_exchangeImplementations(made, asking)
  }

  /// Makes a display link as the system does, then asks for 120 Hz where it is the animation driver's.
  @objc(valence_displayLinkWithTarget:selector:)
  class func valenceDisplayLink(withTarget target: Any, selector: Selector) -> CADisplayLink {
    let link = valenceDisplayLink(withTarget: target, selector: selector)

    if NSStringFromClass(type(of: target as AnyObject)) == "RCTNativeAnimatedNodesManager" {
      link.preferredFrameRateRange = CAFrameRateRange(minimum: 80, maximum: 120, preferred: 120)
    }

    return link
  }
}
