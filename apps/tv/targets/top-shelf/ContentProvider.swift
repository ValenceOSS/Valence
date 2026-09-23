import Foundation
import TVServices

/// One title the app left for the shelf: which it is, what it is called, whether it is a film or a
/// programme, and the name of its picture beside the list.
struct ShelfTitle: Decodable {
  let id: String
  let title: String
  let kind: String
  let image: String
}

/// Fills the space above Valence in the television's top row with what has just arrived in the
/// library, from the list the app keeps in the container they share, so the shelf never has to ask
/// the server or sign in. Choosing one opens Valence on it.
final class ContentProvider: TVTopShelfContentProvider {
  override func loadTopShelfContent() async -> TVTopShelfContent? {
    guard
      let shared = FileManager.default.containerURL(
        forSecurityApplicationGroupIdentifier: "group.app.valence.tv"
      )
    else { return nil }

    let shelf = shared.appendingPathComponent("topshelf", isDirectory: true)

    guard
      let listed = try? Data(contentsOf: shelf.appendingPathComponent("items.json")),
      let titles = try? JSONDecoder().decode([ShelfTitle].self, from: listed),
      !titles.isEmpty
    else { return nil }

    let items = titles.map { title -> TVTopShelfSectionedItem in
      let item = TVTopShelfSectionedItem(identifier: title.id)
      let picture = shelf.appendingPathComponent(title.image)

      item.title = title.title
      item.imageShape = .hdtv
      item.setImageURL(picture, for: .screenScale1x)
      item.setImageURL(picture, for: .screenScale2x)

      if let opening = URL(string: "valence://open/\(title.kind)/\(title.id)") {
        item.displayAction = TVTopShelfAction(url: opening)
        item.playAction = TVTopShelfAction(url: opening)
      }

      return item
    }

    let arrived = TVTopShelfItemCollection(items: items)
    arrived.title = "Just arrived"

    return TVTopShelfSectionedContent(sections: [arrived])
  }
}
