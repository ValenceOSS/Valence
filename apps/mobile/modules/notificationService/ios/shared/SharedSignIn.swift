import Foundation
import Security

/// The server the phone is signed in to and the session it holds there, kept in a keychain group the
/// app and its notification service extension share, so the extension can read what a push woke the
/// phone to say. Readable once the phone has been unlocked after starting, since a push can arrive
/// with the phone locked.
enum SharedSignIn {
  struct Held: Codable {
    let address: String
    let cookie: String
  }

  private static let service = "app.valence.signIn"

  private static let account = "current"

  /// The query that names the one item this keeps, in the shared group the build wrote into the
  /// bundle's `Info.plist`.
  private static func query() -> [String: Any] {
    var query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service,
      kSecAttrAccount as String: account,
    ]

    if let group = Bundle.main.object(forInfoDictionaryKey: "ValenceSharedKeychainGroup") as? String {
      query[kSecAttrAccessGroup as String] = group
    }

    return query
  }

  /// Keeps the server and session, in place of whatever was kept before.
  @discardableResult
  static func write(_ held: Held) -> Bool {
    guard let data = try? JSONEncoder().encode(held) else {
      return false
    }

    SecItemDelete(query() as CFDictionary)

    var adding = query()

    adding[kSecValueData as String] = data
    adding[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly

    return SecItemAdd(adding as CFDictionary, nil) == errSecSuccess
  }

  /// The server and session kept, or nothing where the phone is signed out.
  static func read() -> Held? {
    var reading = query()

    reading[kSecReturnData as String] = true
    reading[kSecMatchLimit as String] = kSecMatchLimitOne

    var found: CFTypeRef?

    guard SecItemCopyMatching(reading as CFDictionary, &found) == errSecSuccess,
      let data = found as? Data
    else {
      return nil
    }

    return try? JSONDecoder().decode(Held.self, from: data)
  }

  /// Forgets the server and session, as the phone signs out.
  static func forget() {
    SecItemDelete(query() as CFDictionary)
  }
}
