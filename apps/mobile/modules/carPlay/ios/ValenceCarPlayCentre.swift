import CarPlay
import UIKit

/// One row in a CarPlay list: a song, an album, a playlist or an artist, and whether choosing it
/// opens another list rather than playing.
struct ACarRow {
  let id: String
  let title: String
  let detail: String?
  let artwork: String?
  let opens: Bool
}

/// A titled run of rows.
struct ACarSection {
  let title: String?
  let rows: [ACarRow]
}

/// One tab along the foot of the car's screen.
struct ACarShelf {
  let id: String
  let title: String
  let symbol: String
  let sections: [ACarSection]
}

/// What the car is showing, kept whether or not a car is connected, so plugging the phone in finds
/// the lists already made. The app sends new lists whenever its music changes; this turns them into
/// CarPlay's own templates and tells the app when something is chosen.
public final class ValenceCarPlayCentre {
  public static let shared = ValenceCarPlayCentre()

  private var interface: CPInterfaceController?
  private var shelves: [ACarShelf] = []
  private var cookie: String?
  private var isSignedIn = true
  private var pictures: [String: UIImage] = [:]

  /// Told which row somebody chose, and which list it was in.
  var onChoose: ((String) -> Void)?
  /// Told when a car connects or goes.
  var onCar: ((Bool) -> Void)?

  public func connected(_ controller: CPInterfaceController) {
    interface = controller
    showTheShelves(animated: false)
    onCar?(true)
  }

  public func disconnected() {
    interface = nil
    onCar?(false)
  }

  func setShelves(_ given: [ACarShelf], cookie sent: String?) {
    shelves = given
    cookie = sent
    isSignedIn = true

    guard let interface else {
      return
    }

    if let root = interface.rootTemplate as? CPTabBarTemplate, root.templates.count == given.count {
      let lists = given.map { list(for: $0) }

      root.updateTemplates(lists)
    } else {
      showTheShelves(animated: false)
    }
  }

  func signedOut(_ message: String) {
    isSignedIn = false
    shelves = []

    guard let interface else {
      return
    }

    let item = CPInformationItem(title: "Valence", detail: message)
    let template = CPInformationTemplate(title: "Valence", layout: .leading, items: [item], actions: [])

    interface.setRootTemplate(template, animated: false, completion: nil)
  }

  func push(title: String, sections: [ACarSection]) {
    guard let interface else {
      return
    }

    let template = CPListTemplate(title: title, sections: sections.map { section(for: $0) })

    interface.pushTemplate(template, animated: true, completion: nil)
  }

  func showNowPlaying() {
    guard let interface else {
      return
    }

    if interface.topTemplate is CPNowPlayingTemplate {
      return
    }

    interface.pushTemplate(CPNowPlayingTemplate.shared, animated: true, completion: nil)
  }

  private func showTheShelves(animated: Bool) {
    guard let interface else {
      return
    }

    guard isSignedIn, !shelves.isEmpty else {
      let item = CPInformationItem(title: "Valence", detail: "Open Valence on your iPhone to see your music here.")
      let template = CPInformationTemplate(title: "Valence", layout: .leading, items: [item], actions: [])

      interface.setRootTemplate(template, animated: animated, completion: nil)

      return
    }

    let tabs = CPTabBarTemplate(templates: shelves.prefix(CPTabBarTemplate.maximumTabCount).map { list(for: $0) })

    interface.setRootTemplate(tabs, animated: animated, completion: nil)
  }

  private func list(for shelf: ACarShelf) -> CPListTemplate {
    let template = CPListTemplate(title: shelf.title, sections: shelf.sections.map { section(for: $0) })

    template.tabTitle = shelf.title
    template.tabImage = UIImage(systemName: shelf.symbol)
    template.emptyViewTitleVariants = ["Nothing here yet"]

    return template
  }

  private func section(for given: ACarSection) -> CPListSection {
    let rows = given.rows.prefix(CPListTemplate.maximumItemCount).map { row(for: $0) }

    return CPListSection(items: Array(rows), header: given.title, sectionIndexTitle: nil)
  }

  private func row(for given: ACarRow) -> CPListItem {
    let item = CPListItem(
      text: given.title,
      detailText: given.detail,
      image: given.artwork.flatMap { pictures[$0] },
      accessoryImage: nil,
      accessoryType: given.opens ? .disclosureIndicator : .none
    )

    item.handler = { [weak self] _, done in
      self?.onChoose?(given.id)
      done()
    }

    if let address = given.artwork, pictures[address] == nil {
      fetch(address) { image in
        item.setImage(image)
      }
    }

    return item
  }

  private func fetch(_ address: String, then: @escaping (UIImage) -> Void) {
    guard let url = URL(string: address) else {
      return
    }

    var asking = URLRequest(url: url)

    if let cookie {
      asking.setValue(cookie, forHTTPHeaderField: "Cookie")
    }

    URLSession.shared.dataTask(with: asking) { [weak self] data, _, _ in
      guard let data, let image = UIImage(data: data) else {
        return
      }

      let small = image.preparingThumbnail(of: CGSize(width: 180, height: 180)) ?? image

      DispatchQueue.main.async {
        self?.pictures[address] = small
        then(small)
      }
    }.resume()
  }
}
