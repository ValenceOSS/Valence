import ExpoModulesCore
import UIKit

/// Where the system draws its status — the clock, the signal and the battery — on the screen.
///
/// A folding phone moves them into a strip down the side of its screen, under the island, and
/// anything an app lays in that strip has to start below them and share their centre line. Only
/// UIKit knows where they are, so this asks the scene the app is drawn in.
public class ValenceSideStripModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ValenceSideStrip")

    AsyncFunction("statusFrame") { () -> [String: Double]? in
      MainActor.assumeIsolated {
        let scene = UIApplication.shared.connectedScenes
          .compactMap { $0 as? UIWindowScene }
          .first { $0.activationState == .foregroundActive }

        guard let frame = scene?.statusBarManager?.statusBarFrame, !frame.isEmpty else {
          return nil
        }

        return [
          "x": Double(frame.minX),
          "y": Double(frame.minY),
          "width": Double(frame.width),
          "height": Double(frame.height),
        ]
      }
    }.runOnQueue(.main)
  }
}
