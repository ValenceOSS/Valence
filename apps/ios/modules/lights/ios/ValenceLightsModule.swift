import ExpoModulesCore
import UIKit

/// Reads the colours of a picture into lights for the background behind a page, the way the web
/// reads them from a canvas, so a phone's page is lit by its artwork as the web's is.
///
/// The picture is shrunk to a few pixels and cut into a grid, four across and three down, and each
/// part's average colour is pushed away from grey and lifted out of the dark, so a muddy frame
/// still gives a colour worth lighting a page with. Each light says where on the page it belongs.
public class ValenceLightsModule: Module {
  private static let readAt = 24
  private static let spread = 1.9
  private static let minPeak = 110.0
  private static let columns = [8, 36, 64, 92]
  private static let rows = [10, 48, 86]

  public func definition() -> ModuleDefinition {
    Name("ValenceLights")

    AsyncFunction("readLights") { (url: String, cookie: String?, promise: Promise) in
      guard let address = URL(string: url) else {
        promise.resolve([])
        return
      }

      var asking = URLRequest(url: address)

      if let cookie {
        asking.setValue(cookie, forHTTPHeaderField: "Cookie")
      }

      URLSession.shared.dataTask(with: asking) { data, _, _ in
        guard let data, let image = UIImage(data: data)?.cgImage else {
          promise.resolve([])
          return
        }

        promise.resolve(Self.lights(of: image))
      }.resume()
    }
  }

  /// The lights a picture gives, each a colour and where it sits on the page.
  private static func lights(of image: CGImage) -> [[String: String]] {
    let side = readAt
    var pixels = [UInt8](repeating: 0, count: side * side * 4)

    guard let context = CGContext(
      data: &pixels,
      width: side,
      height: side,
      bitsPerComponent: 8,
      bytesPerRow: side * 4,
      space: CGColorSpaceCreateDeviceRGB(),
      bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    ) else {
      return []
    }

    context.draw(image, in: CGRect(x: 0, y: 0, width: side, height: side))

    var found: [[String: String]] = []

    for (row, down) in rows.enumerated() {
      for (column, across) in columns.enumerated() {
        let left = column * side / columns.count
        let top = row * side / rows.count
        let wide = max(1, side / columns.count)
        let high = max(1, side / rows.count)
        var red = 0.0
        var green = 0.0
        var blue = 0.0
        var counted = 0.0

        for y in top..<min(top + high, side) {
          for x in left..<min(left + wide, side) {
            let at = (y * side + x) * 4

            red += Double(pixels[at])
            green += Double(pixels[at + 1])
            blue += Double(pixels[at + 2])
            counted += 1
          }
        }

        guard counted > 0 else {
          continue
        }

        let average = (red + green + blue) / (counted * 3)
        let lifted = [red, green, blue].map { channel in
          min(255, max(0, (average + (channel / counted - average) * spread).rounded()))
        }
        let peak = lifted.max() ?? 0
        let scale = peak == 0 || peak >= minPeak ? 1 : minPeak / peak
        let lit = lifted.map { Int(min(255, ($0 * scale).rounded())) }

        found.append([
          "colour": "rgb(\(lit[0]), \(lit[1]), \(lit[2]))",
          "at": "\(across)% \(down)%",
        ])
      }
    }

    return found
  }
}
