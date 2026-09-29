import ExpoModulesCore

/// A row the app sends for a CarPlay list.
struct ACarRowSent: Record {
  @Field var id: String = ""
  @Field var title: String = ""
  @Field var detail: String? = nil
  @Field var artwork: String? = nil
  @Field var opens: Bool = false
}

/// A titled run of rows the app sends.
struct ACarSectionSent: Record {
  @Field var title: String? = nil
  @Field var rows: [ACarRowSent] = []
}

/// A tab the app sends.
struct ACarShelfSent: Record {
  @Field var id: String = ""
  @Field var title: String = ""
  @Field var symbol: String = "music.note"
  @Field var sections: [ACarSectionSent] = []
}

/// Lets the app fill CarPlay: its tabs and lists of music, a list pushed when something opens, and
/// the system Now Playing screen. What was chosen comes back as an event, since what choosing means
/// is the app's to decide.
public class ValenceCarPlayModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ValenceCarPlay")

    Events("onChoose", "onCar")

    OnStartObserving {
      ValenceCarPlayCentre.shared.onChoose = { [weak self] id in
        self?.sendEvent("onChoose", ["id": id])
      }
      ValenceCarPlayCentre.shared.onCar = { [weak self] isConnected in
        self?.sendEvent("onCar", ["isConnected": isConnected])
      }
    }

    Function("setShelves") { (shelves: [ACarShelfSent], cookie: String?) in
      let made = shelves.map { shelf in
        ACarShelf(id: shelf.id, title: shelf.title, symbol: shelf.symbol, sections: shelf.sections.map(Self.section))
      }

      DispatchQueue.main.async {
        ValenceCarPlayCentre.shared.setShelves(made, cookie: cookie)
      }
    }

    Function("push") { (title: String, sections: [ACarSectionSent]) in
      let made = sections.map(Self.section)

      DispatchQueue.main.async {
        ValenceCarPlayCentre.shared.push(title: title, sections: made)
      }
    }

    Function("showNowPlaying") {
      DispatchQueue.main.async {
        ValenceCarPlayCentre.shared.showNowPlaying()
      }
    }

    Function("signedOut") { (message: String) in
      DispatchQueue.main.async {
        ValenceCarPlayCentre.shared.signedOut(message)
      }
    }
  }

  private static func section(_ sent: ACarSectionSent) -> ACarSection {
    ACarSection(
      title: sent.title,
      rows: sent.rows.map { ACarRow(id: $0.id, title: $0.title, detail: $0.detail, artwork: $0.artwork, opens: $0.opens) }
    )
  }
}
