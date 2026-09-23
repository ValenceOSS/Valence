import ExpoModulesCore
import Foundation
import GameController

/// How far a thumb has turned round the Siri Remote's clickpad, for scrubbing by circling it as the
/// television's own player does. While listening, it asks the remote for where the thumb sits on the
/// pad rather than how far it has moved, follows the angle of a thumb near the ring's edge, and tells
/// JavaScript every couple of degrees how far it has turned, clockwise counted as forwards.
public class ValenceRemoteRingModule: Module {
  private var lastAngle: Double?
  private var turned: Double = 0
  private var isListening = false
  private var connected: NSObjectProtocol?

  private static let ringFrom = 0.55
  private static let reportsEvery = 2.0

  public func definition() -> ModuleDefinition {
    Name("ValenceRemoteRing")

    Events("onRingTurn")

    Function("start") {
      self.isListening = true
      self.listenToEveryRemote()
      self.connected = NotificationCenter.default.addObserver(
        forName: .GCControllerDidConnect,
        object: nil,
        queue: .main
      ) { [weak self] _ in
        self?.listenToEveryRemote()
      }
    }

    Function("stop") {
      self.isListening = false
      self.lastAngle = nil
      self.turned = 0

      if let connected = self.connected {
        NotificationCenter.default.removeObserver(connected)
        self.connected = nil
      }

      for controller in GCController.controllers() {
        guard let pad = controller.microGamepad else { continue }

        pad.dpad.valueChangedHandler = nil
        pad.reportsAbsoluteDpadValues = false
      }
    }
  }

  /// Asks each remote for where the thumb sits on its pad, and follows it round the ring.
  private func listenToEveryRemote() {
    guard isListening else { return }

    for controller in GCController.controllers() {
      guard let pad = controller.microGamepad else { continue }

      pad.reportsAbsoluteDpadValues = true
      pad.dpad.valueChangedHandler = { [weak self] _, x, y in
        self?.follow(x: Double(x), y: Double(y))
      }
    }
  }

  /// Turns a thumb's place on the pad into how far round the ring it has moved since it last moved.
  private func follow(x: Double, y: Double) {
    guard hypot(x, y) >= Self.ringFrom else {
      lastAngle = nil
      turned = 0
      return
    }

    let angle = atan2(y, x) * 180 / .pi

    if let last = lastAngle {
      var moved = angle - last

      if moved > 180 { moved -= 360 }
      if moved < -180 { moved += 360 }

      turned -= moved

      if abs(turned) >= Self.reportsEvery {
        sendEvent("onRingTurn", ["degrees": turned])
        turned = 0
      }
    }

    lastAngle = angle
  }
}
