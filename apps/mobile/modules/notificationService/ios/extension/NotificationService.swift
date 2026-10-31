import Foundation
import UserNotifications

/// Shows what a push woke the phone to say. Valence's push relay never carries a notification's
/// words, only an identifier for it, so before the banner shows this reads them from the server the
/// phone is signed in to, with the session the app shared, and puts them in place of the push's own
/// generic words. Where the server cannot be reached in time, or the delivery is not this phone's,
/// the generic words stand.
final class NotificationService: UNNotificationServiceExtension {
  private struct Said: Decodable {
    let message: String
  }

  private struct Delivery: Decodable {
    let event: String
    let title: Said
    let body: Said
    let link: String?
  }

  private let lock = NSLock()

  private var deliver: ((UNNotificationContent) -> Void)?

  private var shown: UNMutableNotificationContent?

  private var reading: URLSessionDataTask?

  override func didReceive(
    _ request: UNNotificationRequest,
    withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void
  ) {
    guard let content = request.content.mutableCopy() as? UNMutableNotificationContent else {
      contentHandler(request.content)
      return
    }

    deliver = contentHandler
    shown = content

    guard let valence = request.content.userInfo["valence"] as? [String: Any],
      let deliveryId = valence["d"] as? String,
      deliveryId.allSatisfy({ $0.isLetter || $0.isNumber || $0 == "-" }),
      let held = SharedSignIn.read(),
      let address = URL(string: "\(held.address)/api/notifications/deliveries/\(deliveryId)")
    else {
      finish()
      return
    }

    var asking = URLRequest(url: address, timeoutInterval: 20)

    asking.setValue(held.cookie, forHTTPHeaderField: "Cookie")
    asking.setValue("application/json", forHTTPHeaderField: "Accept")

    reading = URLSession.shared.dataTask(with: asking) { [weak self] data, response, _ in
      if let data,
        (response as? HTTPURLResponse)?.statusCode == 200,
        let delivery = try? JSONDecoder().decode(Delivery.self, from: data)
      {
        self?.show(delivery)
      }

      self?.finish()
    }
    reading?.resume()
  }

  override func serviceExtensionTimeWillExpire() {
    reading?.cancel()
    finish()
  }

  /// Puts what the server said in place of the push's generic words.
  private func show(_ delivery: Delivery) {
    lock.lock()
    defer { lock.unlock() }

    shown?.title = delivery.title.message
    shown?.body = delivery.body.message
    shown?.threadIdentifier = delivery.event

    if let link = delivery.link {
      shown?.userInfo["link"] = link
    }
  }

  /// Hands iOS the notification to show, once.
  private func finish() {
    lock.lock()

    let handing = deliver
    let content = shown

    deliver = nil
    lock.unlock()

    if let handing, let content {
      handing(content)
    }
  }
}
