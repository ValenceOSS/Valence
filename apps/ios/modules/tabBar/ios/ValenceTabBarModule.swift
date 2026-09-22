import ExpoModulesCore
import UIKit

/// The system tab bar, for a phone with liquid glass.
///
/// On iOS 26 the tab bar floats in a glass capsule, and holding it swells the selection into a lens
/// that slides between tabs and settles on whichever one it is let go over. That is the system bar's
/// own behaviour rather than anything glass can be asked for, so the bar itself is put under React
/// Native. Older phones keep the dock React Native draws, which is why this also says whether the
/// phone has liquid glass at all.
///
/// The bar is told which tab is showing rather than keeping its own idea of it, so what it shows is
/// always what the app is showing.
public class ValenceTabBarModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ValenceTabBar")

    Function("hasLiquidGlass") { () -> Bool in
      if #available(iOS 26.0, *) {
        return true
      }

      return false
    }

    View(ValenceTabBarView.self) {
      Events("onSelect", "onMeasure")

      Prop("tabs") { (view: ValenceTabBarView, tabs: [ATab]) in
        view.tabs = tabs
      }

      Prop("selected") { (view: ValenceTabBarView, selected: String) in
        view.selected = selected
      }

      Prop("accent") { (view: ValenceTabBarView, accent: UIColor) in
        view.accent = accent
      }
    }
  }
}

/// One tab: what the app calls it, what it says, and the SF Symbol drawn over it.
struct ATab: Record {
  @Field var id: String = ""
  @Field var title: String = ""
  @Field var symbol: String = ""
}

/// Holds a `UITabBar` the size of the view, and says how tall the bar wants to be so the screen above
/// can leave room for it.
public class ValenceTabBarView: ExpoView, UITabBarDelegate {
  let onSelect = EventDispatcher()
  let onMeasure = EventDispatcher()

  private let bar = UITabBar()
  private var lastMeasured: CGFloat = 0

  var tabs: [ATab] = [] {
    didSet {
      bar.items = tabs.enumerated().map { index, tab in
        UITabBarItem(title: tab.title, image: UIImage(systemName: tab.symbol), tag: index)
      }
      showTheSelected()
    }
  }

  var selected: String = "" {
    didSet {
      showTheSelected()
    }
  }

  var accent: UIColor = .systemBlue {
    didSet {
      bar.tintColor = accent
    }
  }

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)

    bar.delegate = self
    addSubview(bar)
  }

  public override func safeAreaInsetsDidChange() {
    super.safeAreaInsetsDidChange()
    setNeedsLayout()
  }

  public override func layoutSubviews() {
    super.layoutSubviews()

    let wanted = bar.sizeThatFits(CGSize(width: bounds.width, height: .greatestFiniteMagnitude))

    bar.frame = CGRect(x: 0, y: bounds.height - wanted.height, width: bounds.width, height: wanted.height)

    if wanted.height != lastMeasured {
      lastMeasured = wanted.height
      onMeasure(["height": wanted.height])
    }
  }

  public func tabBar(_ tabBar: UITabBar, didSelect item: UITabBarItem) {
    guard tabs.indices.contains(item.tag) else {
      return
    }

    onSelect(["id": tabs[item.tag].id])
  }

  private func showTheSelected() {
    bar.selectedItem = bar.items?.first { item in
      tabs.indices.contains(item.tag) && tabs[item.tag].id == selected
    }
  }
}
