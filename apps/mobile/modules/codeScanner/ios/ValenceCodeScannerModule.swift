import AVFoundation
import ExpoModulesCore
import UIKit
import VisionKit

/// Reads one QR code with the camera, in VisionKit's own scanner, raised over whatever is on screen.
///
/// What comes back is always an answer rather than an error, because every way it ends is something
/// the screen that asked has to say something about: a code was read, somebody closed the scanner,
/// the camera was refused, or this device has no scanner — which is only ever the simulator, since
/// every iPhone that runs iOS 18 has one.
public class ValenceCodeScannerModule: Module {
  private var scanning: Scanning?

  public func definition() -> ModuleDefinition {
    Name("ValenceCodeScanner")

    AsyncFunction("scan") { [weak self] (promise: Promise) in
      MainActor.assumeIsolated {
        guard DataScannerViewController.isSupported else {
          promise.resolve(["kind": "unable"])

          return
        }

        AVCaptureDevice.requestAccess(for: .video) { isAllowed in
          DispatchQueue.main.async {
            MainActor.assumeIsolated {
              guard let self else {
                promise.resolve(["kind": "unable"])

                return
              }

              guard isAllowed, DataScannerViewController.isAvailable else {
                promise.resolve(["kind": "refused"])

                return
              }

              self.scanning = Scanning { [weak self] answer in
                self?.scanning = nil
                promise.resolve(answer)
              }
              self.scanning?.start()
            }
          }
        }
      }
    }.runOnQueue(.main)
  }
}

/// One turn of the scanner: raised, read from once, and put away again, answering exactly once
/// however it ends.
@MainActor
private final class Scanning: NSObject, DataScannerViewControllerDelegate,
  UIAdaptivePresentationControllerDelegate
{
  private let answer: ([String: String]) -> Void
  private var hasAnswered = false
  private let scanner = DataScannerViewController(
    recognizedDataTypes: [.barcode(symbologies: [.qr])],
    qualityLevel: .balanced,
    recognizesMultipleItems: false,
    isHighFrameRateTrackingEnabled: false,
    isPinchToZoomEnabled: true,
    isGuidanceEnabled: true,
    isHighlightingEnabled: true
  )

  init(answer: @escaping ([String: String]) -> Void) {
    self.answer = answer
  }

  /// Raises the scanner over the frontmost screen and starts the camera once it is up.
  func start() {
    scanner.delegate = self
    scanner.navigationItem.title = "Scan the code"
    scanner.navigationItem.rightBarButtonItem = UIBarButtonItem(
      systemItem: .close,
      primaryAction: UIAction { [weak self] _ in
        self?.finish(["kind": "closed"])
      }
    )

    let sheet = UINavigationController(rootViewController: scanner)
    sheet.presentationController?.delegate = self

    guard let over = Scanning.frontmost() else {
      answerOnce(["kind": "unable"])

      return
    }

    over.present(sheet, animated: true) { [weak self] in
      do {
        try self?.scanner.startScanning()
      } catch {
        self?.finish(["kind": "unable"])
      }
    }
  }

  func dataScanner(
    _ dataScanner: DataScannerViewController,
    didAdd addedItems: [RecognizedItem],
    allItems: [RecognizedItem]
  ) {
    for item in addedItems {
      if case .barcode(let code) = item, let said = code.payloadStringValue {
        finish(["kind": "read", "text": said])

        return
      }
    }
  }

  func presentationControllerDidDismiss(_ presentationController: UIPresentationController) {
    scanner.stopScanning()
    answerOnce(["kind": "closed"])
  }

  /// Stops the camera, puts the scanner away and answers.
  private func finish(_ with: [String: String]) {
    scanner.stopScanning()
    scanner.navigationController?.dismiss(animated: true)
    answerOnce(with)
  }

  /// Answers the first time and never again, since a code can be seen twice before the sheet goes.
  private func answerOnce(_ with: [String: String]) {
    guard !hasAnswered else {
      return
    }

    hasAnswered = true
    answer(with)
  }

  /// The screen on top of everything else, which is the one the scanner has to rise over.
  private static func frontmost() -> UIViewController? {
    var top = UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap(\.windows)
      .first(where: \.isKeyWindow)?
      .rootViewController

    while let above = top?.presentedViewController {
      top = above
    }

    return top
  }
}
