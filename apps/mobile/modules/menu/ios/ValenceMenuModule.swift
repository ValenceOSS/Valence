import ExpoModulesCore
import UIKit

/// The system's menu, dropped from a control React Native draws.
///
/// The system lifts whatever is drawn inside a menu's button away from the page as the menu opens
/// and, once it closes, settles it back where it stood when it opened, so on a page scrolled
/// meanwhile it lands over the wrong part of it. This is UIKit's own menu button, unseen over the
/// control, so there is nothing of it to lift, and it says when its menu opens and when it starts
/// to close, for the control beneath to answer as it likes.
public class ValenceMenuModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ValenceMenu")

    View(ValenceMenuView.self) {
      Events("onChoose", "onOpen", "onClose")

      Prop("items") { (view: ValenceMenuView, items: [AMenuChoice]) in
        view.items = items
      }
    }
  }
}

/// One thing the menu offers: what it says, its SF Symbol, whether it is the one chosen, whether
/// it removes something, and whether a line goes above it.
struct AMenuChoice: Record {
  @Field var id: String = ""
  @Field var label: String = ""
  @Field var symbol: String? = nil
  @Field var isChosen: Bool = false
  @Field var isDestructive: Bool = false
  @Field var startsAGroup: Bool = false
}

/// Lays an unseen menu button over the control drawn beneath it, the size of the view, and says
/// when its menu opens and closes and which item was picked.
public class ValenceMenuView: ExpoView {
  let onChoose = EventDispatcher()
  let onOpen = EventDispatcher()
  let onClose = EventDispatcher()

  private let opener = MenuOpener(type: .custom)

  var items: [AMenuChoice] = [] {
    didSet {
      opener.menu = theMenu()
    }
  }

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)

    opener.showsMenuAsPrimaryAction = true
    opener.onOpen = { [weak self] in
      self?.onOpen()
    }
    opener.onClose = { [weak self] in
      self?.onClose()
    }
    addSubview(opener)
  }

  public override func layoutSubviews() {
    super.layoutSubviews()

    opener.frame = bounds
  }

  /// The menu, its items grouped between the lines asked for and each group drawn in place.
  private func theMenu() -> UIMenu {
    var groups: [[UIMenuElement]] = []

    for item in items {
      if groups.isEmpty || item.startsAGroup {
        groups.append([])
      }

      groups[groups.count - 1].append(action(for: item))
    }

    return UIMenu(children: groups.map { UIMenu(options: .displayInline, children: $0) })
  }

  /// One item as the system draws it, saying its id when picked.
  private func action(for item: AMenuChoice) -> UIAction {
    let symbol = item.isChosen ? "checkmark" : item.symbol
    let action = UIAction(
      title: item.label,
      image: symbol.flatMap { UIImage(systemName: $0) }
    ) { [weak self] _ in
      self?.onChoose(["id": item.id])
    }

    if item.isDestructive {
      action.attributes = .destructive
    }

    return action
  }
}

/// The menu button, which says when its menu opens and when it starts to close.
final class MenuOpener: UIButton {
  var onOpen: () -> Void = {}

  var onClose: () -> Void = {}

  override func contextMenuInteraction(
    _ interaction: UIContextMenuInteraction,
    willDisplayMenuFor configuration: UIContextMenuConfiguration,
    animator: UIContextMenuInteractionAnimating?
  ) {
    super.contextMenuInteraction(interaction, willDisplayMenuFor: configuration, animator: animator)

    onOpen()
  }

  override func contextMenuInteraction(
    _ interaction: UIContextMenuInteraction,
    willEndFor configuration: UIContextMenuConfiguration,
    animator: UIContextMenuInteractionAnimating?
  ) {
    super.contextMenuInteraction(interaction, willEndFor: configuration, animator: animator)

    onClose()
  }
}
