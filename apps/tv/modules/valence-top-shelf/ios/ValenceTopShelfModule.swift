import ExpoModulesCore
import Foundation
#if os(tvOS)
import TVServices
#endif

/// A title for the shelf, as JavaScript hands it over.
struct ShelfEntry: Record {
  @Field var id: String = ""
  @Field var title: String = ""
  @Field var kind: String = ""
  @Field var imageUrl: String = ""
}

/// One title as the shelf reads it back.
struct ShelvedTitle: Encodable {
  let id: String
  let title: String
  let kind: String
  let image: String
}

/// Keeps the titles the television shows above Valence in its top row: their pictures are fetched
/// here, signed as whoever is watching, and written with the list into the container the shelf
/// shares with the app, and the television is told the shelf has changed.
public class ValenceTopShelfModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ValenceTopShelf")

    AsyncFunction("publish") { (entries: [ShelfEntry], headers: [String: String]) in
      guard
        let shared = FileManager.default.containerURL(
          forSecurityApplicationGroupIdentifier: "group.app.valence.tv"
        )
      else { return }

      let shelf = shared.appendingPathComponent("topshelf", isDirectory: true)

      try? FileManager.default.createDirectory(at: shelf, withIntermediateDirectories: true)

      var shelved: [ShelvedTitle] = []

      for entry in entries {
        guard let address = URL(string: entry.imageUrl) else { continue }

        var asking = URLRequest(url: address)

        for (name, value) in headers {
          asking.setValue(value, forHTTPHeaderField: name)
        }

        guard
          let (picture, answer) = try? await URLSession.shared.data(for: asking),
          (answer as? HTTPURLResponse)?.statusCode == 200
        else { continue }

        let name = "\(entry.id).jpg"

        guard (try? picture.write(to: shelf.appendingPathComponent(name))) != nil else { continue }

        shelved.append(ShelvedTitle(id: entry.id, title: entry.title, kind: entry.kind, image: name))
      }

      if let listed = try? JSONEncoder().encode(shelved) {
        try? listed.write(to: shelf.appendingPathComponent("items.json"))
      }

      #if os(tvOS)
      TVTopShelfContentProvider.topShelfContentDidChange()
      #endif
    }
  }
}
