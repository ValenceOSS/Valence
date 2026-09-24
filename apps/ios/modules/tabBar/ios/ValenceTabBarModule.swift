import ExpoModulesCore
import UIKit
import WebKit

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
      Events("onSelect", "onMeasure", "onFaceAt")

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

/// One tab: what the app calls it, what it says, and the SF Symbol drawn over it, or a face drawn
/// in its place from a picture, or an initial on a colour where there is no picture.
struct ATab: Record {
  @Field var id: String = ""
  @Field var title: String = ""
  @Field var symbol: String = ""
  @Field var picture: String? = nil
  @Field var backdrop: UIColor? = nil
  @Field var initial: String? = nil
}

/// Holds a `UITabBar` the size of the view, and says how tall the bar wants to be so the screen above
/// can leave room for it. Its labels are set in Gilroy, the face the rest of Valence is set in.
public class ValenceTabBarView: ExpoView, UITabBarDelegate {
  let onSelect = EventDispatcher()
  let onMeasure = EventDispatcher()
  let onFaceAt = EventDispatcher()

  private let bar = UITabBar()
  private var lastMeasured: CGFloat = 0
  private var lastFaceAt: CGRect = .null
  private var pictures: [String: UIImage] = [:]
  private var fetching: Set<String> = []
  private var drawing: [SvgSnapshot] = []

  var tabs: [ATab] = [] {
    didSet {
      bar.items = tabs.enumerated().map { index, tab in
        let item = UITabBarItem(title: tab.title, image: UIImage(systemName: tab.symbol), tag: index)

        dressAsAFace(item, tab)

        if let face = UIFont(name: "Gilroy-Medium", size: 10),
           let chosen = UIFont(name: "Gilroy-Semibold", size: 10) {
          item.setTitleTextAttributes([.font: face], for: .normal)
          item.setTitleTextAttributes([.font: chosen], for: .selected)
        }

        return item
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
      bar.items?.forEach { item in
        if tabs.indices.contains(item.tag) {
          dressAsAFace(item, tabs[item.tag])
        }
      }
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

    DispatchQueue.main.async { [weak self] in
      self?.sayWhereTheFaceIs()
    }
  }

  /// Says where on screen the tab drawn as a face shows it, so a face can fly there.
  private func sayWhereTheFaceIs() {
    guard let index = tabs.firstIndex(where: { $0.picture != nil || $0.initial != nil }),
          let item = bar.items?.first(where: { $0.tag == index }),
          window != nil else {
      return
    }

    let at = whereTheImageIs(item) ?? guessWhereTheImageIs(index)

    guard at != lastFaceAt, at.width > 0 else {
      return
    }

    lastFaceAt = at
    onFaceAt(["x": at.minX, "y": at.minY, "width": at.width, "height": at.height])
  }

  private func whereTheImageIs(_ item: UITabBarItem) -> CGRect? {
    let asked = NSSelectorFromString("view")

    guard item.responds(to: asked),
          let button = item.perform(asked)?.takeUnretainedValue() as? UIView,
          let image = firstImage(in: button) else {
      return nil
    }

    return image.convert(image.bounds, to: nil)
  }

  private func firstImage(in view: UIView) -> UIImageView? {
    for inside in view.subviews {
      if let image = inside as? UIImageView, image.image != nil, !image.isHidden {
        return image
      }

      if let found = firstImage(in: inside) {
        return found
      }
    }

    return nil
  }

  private func guessWhereTheImageIs(_ index: Int) -> CGRect {
    let whole = bar.convert(bar.bounds, to: nil)
    let across = whole.width / CGFloat(max(tabs.count, 1))
    let side = TabFace.side

    return CGRect(
      x: whole.minX + across * (CGFloat(index) + 0.5) - side / 2,
      y: whole.minY + 10,
      width: side,
      height: side
    )
  }

  public func tabBar(_ tabBar: UITabBar, didSelect item: UITabBarItem) {
    guard tabs.indices.contains(item.tag) else {
      return
    }

    onSelect(["id": tabs[item.tag].id])
  }

  /// Draws a tab that stands for somebody as their face, fetching the picture the first time.
  private func dressAsAFace(_ item: UITabBarItem, _ tab: ATab) {
    guard tab.picture != nil || tab.initial != nil else {
      return
    }

    let picture = tab.picture.flatMap { pictures[$0] }

    item.image = TabFace.draw(picture, initial: tab.initial, backdrop: tab.backdrop, ring: nil)
    item.selectedImage = TabFace.draw(picture, initial: tab.initial, backdrop: tab.backdrop, ring: accent)

    if let address = tab.picture, picture == nil {
      fetch(address)
    }
  }

  /// Reads a picture from the server, drawing a vector face through WebKit since UIKit cannot.
  private func fetch(_ address: String) {
    guard !fetching.contains(address), let url = URL(string: address) else {
      return
    }

    fetching.insert(address)

    URLSession.shared.dataTask(with: url) { [weak self] data, response, _ in
      let type = (response as? HTTPURLResponse)?.value(forHTTPHeaderField: "Content-Type") ?? ""

      DispatchQueue.main.async {
        guard let self, let data else {
          return
        }

        if type.contains("svg") {
          let snapshot = SvgSnapshot(data, in: self) { [weak self] image in
            self?.arrived(address, image)
          }

          self.drawing.append(snapshot)
        } else {
          self.arrived(address, UIImage(data: data))
        }
      }
    }.resume()
  }

  private func arrived(_ address: String, _ image: UIImage?) {
    fetching.remove(address)
    drawing.removeAll { $0.isDone }

    guard let image else {
      return
    }

    pictures[address] = image
    bar.items?.forEach { item in
      if tabs.indices.contains(item.tag), tabs[item.tag].picture == address {
        dressAsAFace(item, tabs[item.tag])
      }
    }
  }

  private func showTheSelected() {
    bar.selectedItem = bar.items?.first { item in
      tabs.indices.contains(item.tag) && tabs[item.tag].id == selected
    }
  }
}

/// A face the size of a tab's symbol: the picture filling a circle, or an initial on a colour, with
/// a ring round it when the tab is showing.
enum TabFace {
  static let side: CGFloat = 28

  static func draw(_ picture: UIImage?, initial: String?, backdrop: UIColor?, ring: UIColor?) -> UIImage {
    let whole = CGRect(x: 0, y: 0, width: side, height: side)

    return UIGraphicsImageRenderer(size: whole.size).image { _ in
      let face = ring == nil ? whole.insetBy(dx: 1, dy: 1) : whole.insetBy(dx: 3.5, dy: 3.5)

      if let ring {
        ring.setStroke()
        let edge = UIBezierPath(ovalIn: whole.insetBy(dx: 1, dy: 1))
        edge.lineWidth = 2
        edge.stroke()
      }

      UIBezierPath(ovalIn: face).addClip()
      (backdrop ?? .systemGray).setFill()
      UIRectFill(face)

      if let picture {
        let scale = max(face.width / picture.size.width, face.height / picture.size.height)
        let size = CGSize(width: picture.size.width * scale, height: picture.size.height * scale)

        picture.draw(in: CGRect(x: face.midX - size.width / 2, y: face.midY - size.height / 2, width: size.width, height: size.height))
      } else if let initial {
        let font = UIFont(name: "Gilroy-Bold", size: face.height * 0.5) ?? .boldSystemFont(ofSize: face.height * 0.5)
        let said = NSAttributedString(string: initial, attributes: [.font: font, .foregroundColor: UIColor.white])
        let size = said.size()

        said.draw(at: CGPoint(x: face.midX - size.width / 2, y: face.midY - size.height / 2))
      }
    }.withRenderingMode(.alwaysOriginal)
  }
}

/// Draws an SVG to an image by loading it into a web view that is never seen and snapshotting it.
final class SvgSnapshot: NSObject, WKNavigationDelegate {
  private let web: WKWebView
  private let then: (UIImage?) -> Void
  private(set) var isDone = false

  init(_ svg: Data, in host: UIView, then: @escaping (UIImage?) -> Void) {
    let side: CGFloat = 96

    web = WKWebView(frame: CGRect(x: 0, y: 0, width: side, height: side))
    web.isOpaque = false
    web.backgroundColor = .clear
    web.alpha = 0.01
    web.isUserInteractionEnabled = false
    self.then = then

    super.init()

    web.navigationDelegate = self
    host.addSubview(web)
    host.sendSubviewToBack(web)
    web.loadHTMLString(
      "<html><head><meta name=\"viewport\" content=\"width=\(Int(side))\"></head><body style=\"margin:0;background:transparent\"><img style=\"width:100vw;height:100vh;display:block\" src=\"data:image/svg+xml;base64,\(svg.base64EncodedString())\"></body></html>",
      baseURL: nil
    )
  }

  func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
    let shot = WKSnapshotConfiguration()

    shot.afterScreenUpdates = true
    webView.takeSnapshot(with: shot) { [weak self] image, _ in
      self?.finish(image)
    }
  }

  func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
    finish(nil)
  }

  private func finish(_ image: UIImage?) {
    isDone = true
    web.removeFromSuperview()
    then(image)
  }
}
