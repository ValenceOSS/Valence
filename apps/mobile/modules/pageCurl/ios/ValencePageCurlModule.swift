import ExpoModulesCore
import UIKit

/// Pages turned the way a printed book's are, by UIKit's own page curl.
///
/// The curl follows the finger from wherever it took hold of the page: lifted by the bottom corner
/// the page peels from there, by the top corner from the top, by the middle of the edge straight
/// across, and let go early it falls back. That is what `UIPageViewController` does and nothing
/// drawn in React Native can, so this lays it under a reader that is otherwise TypeScript's.
///
/// It is handed the address of every page and which one to show, and says when a page was turned,
/// when the middle of the page was tapped, when somebody tried to turn past the last page, and the
/// colour of the paper round the page showing, which each leaf is laid on so a page that does not
/// fill the screen sits on more of itself. A page can be pinched to look closer — a spread as one,
/// both pages together from where the fingers are — and while it is, it holds still rather than
/// turning.
public class ValencePageCurlModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ValencePageCurl")

    View(ValencePageCurlView.self) {
      Events("onTurn", "onMiddle", "onPastTheEnd", "onPaper")

      Prop("pages") { (view: ValencePageCurlView, pages: [String]) in
        view.pages = pages
      }

      Prop("page") { (view: ValencePageCurlView, page: Int) in
        view.wanted = page
      }

      Prop("isTwoUp") { (view: ValencePageCurlView, isTwoUp: Bool?) in
        view.isTwoUp = isTwoUp ?? false
      }

      Prop("isCoverAlone") { (view: ValencePageCurlView, isCoverAlone: Bool?) in
        view.isCoverAlone = isCoverAlone ?? false
      }

      Prop("isRightToLeft") { (view: ValencePageCurlView, isRightToLeft: Bool?) in
        view.isRightToLeft = isRightToLeft ?? false
      }

      Prop("paper") { (view: ValencePageCurlView, paper: UIColor?) in
        view.paper = paper ?? .black
      }

      Prop("fit") { (view: ValencePageCurlView, fit: String?) in
        view.fit = PageFit(rawValue: fit ?? "") ?? .both
      }

      Prop("isLocked") { (view: ValencePageCurlView, isLocked: Bool?) in
        view.isLocked = isLocked ?? false
      }

      OnViewDidUpdateProps { (view: ValencePageCurlView) in
        view.settle()
      }
    }
  }
}

/// The book: a page controller that curls, fed from the addresses it was handed.
public class ValencePageCurlView: ExpoView, UIPageViewControllerDataSource,
  UIPageViewControllerDelegate, UIGestureRecognizerDelegate
{
  let onTurn = EventDispatcher()
  let onMiddle = EventDispatcher()
  let onPastTheEnd = EventDispatcher()
  let onPaper = EventDispatcher()

  var pages: [String] = []
  var wanted = 0
  var isTwoUp = false
  var isCoverAlone = false
  var isRightToLeft = false
  var paper: UIColor = .black
  var fit: PageFit = .both
  var isLocked = false

  private var pager: UIPageViewController?
  private var sequence: [Int?] = []
  private var builtFor = ""
  private var isZoomed = false
  private let pictures = PagePictures()
  private var closeness: CGFloat = 1
  private var shift = CGPoint.zero
  private var pinchedAt = CGPoint.zero
  private var pinchedFrom: CGFloat = 1
  private let closer = UIPinchGestureRecognizer()
  private let across = UIPanGestureRecognizer()
  private var stage: UIView?
  private var toldPaper = ""

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)

    clipsToBounds = true
    closer.addTarget(self, action: #selector(pinched(_:)))
    closer.delegate = self
    addGestureRecognizer(closer)
    across.addTarget(self, action: #selector(panned(_:)))
    across.delegate = self
    across.maximumNumberOfTouches = 1
    across.isEnabled = false
    addGestureRecognizer(across)

    let tap = UITapGestureRecognizer(target: self, action: #selector(tapped(_:)))

    tap.delegate = self
    addGestureRecognizer(tap)
  }

  public override func layoutSubviews() {
    super.layoutSubviews()

    pager?.view.bounds = CGRect(origin: .zero, size: bounds.size)
    pager?.view.center = CGPoint(x: bounds.midX, y: bounds.midY)
  }

  /// Brings the book up to date with what it was last handed: rebuilt where the way it is laid out
  /// changed, and turned to the page asked for where that is not the one showing — curling there
  /// where it is the page next door, as a turn asked for from outside the book usually is, and
  /// jumping where it is further.
  func settle() {
    backgroundColor = paper

    let shape = "\(pages.count):\(isTwoUp):\(isCoverAlone):\(isRightToLeft)"

    if shape != builtFor || pager == nil {
      builtFor = shape
      build()

      return
    }

    for leaf in leavesShowing() {
      leaf.paper = paper
      leaf.fit = fit
    }

    holdStill(isZoomed)

    guard let at = positionOf(page: wanted), let showing = positionShowing(), at != showing else {
      return
    }

    let isNextDoor = abs(at - showing) == (isTwoUp ? 2 : 1)

    show(at: at, direction: at > showing ? .forward : .reverse, isAnimated: isNextDoor)
  }

  /// Makes a new page controller for the way the pages are laid out now, turned by one finger only so
  /// two are left to pinch: one to the screen bound on
  /// its left, as a single leaf is, or two to a spread bound down the middle. A book read right to
  /// left runs through it backwards, so its next page is always the one to its left.
  private func build() {
    pager?.view.removeFromSuperview()
    stage?.removeFromSuperview()
    stage = nil
    closeness = 1
    shift = .zero
    closer.isEnabled = isTwoUp
    across.isEnabled = false

    var inOrder: [Int?] = (isTwoUp && isCoverAlone ? [nil] : []) + pages.indices.map { $0 }

    if isTwoUp && inOrder.count % 2 == 1 {
      inOrder.append(nil)
    }

    sequence = isRightToLeft ? inOrder.reversed() : inOrder

    let spine: UIPageViewController.SpineLocation = isTwoUp ? .mid : .min
    let made = UIPageViewController(
      transitionStyle: .pageCurl,
      navigationOrientation: .horizontal,
      options: [.spineLocation: NSNumber(value: spine.rawValue)]
    )

    made.isDoubleSided = isTwoUp
    made.dataSource = self
    made.delegate = self
    made.view.backgroundColor = paper

    for recognizer in made.gestureRecognizers where recognizer is UITapGestureRecognizer {
      recognizer.isEnabled = false
    }

    for recognizer in made.gestureRecognizers {
      (recognizer as? UIPanGestureRecognizer)?.maximumNumberOfTouches = 1
    }

    made.view.frame = bounds
    addSubview(made.view)
    pager = made
    isZoomed = false
    show(at: positionOf(page: wanted) ?? 0, direction: .forward, isAnimated: false)
  }

  /// Where in the sequence a page of the book sits, as the first place of its spread.
  private func positionOf(page: Int) -> Int? {
    guard let at = sequence.firstIndex(where: { $0 == page }) else {
      return sequence.isEmpty ? nil : 0
    }

    return isTwoUp ? at - at % 2 : at
  }

  /// Where in the sequence the page, or spread, on screen sits.
  private func positionShowing() -> Int? {
    guard let first = pager?.viewControllers?.first as? PageLeaf else {
      return nil
    }

    return first.position
  }

  private func leavesShowing() -> [PageLeaf] {
    pager?.viewControllers?.compactMap { $0 as? PageLeaf } ?? []
  }

  /// The leaf, or the two of a spread, at a place in the sequence.
  private func leaves(at position: Int) -> [PageLeaf] {
    let span = isTwoUp ? [position, position + 1] : [position]

    return span.filter { sequence.indices.contains($0) }.map(leaf(at:))
  }

  private func leaf(at position: Int) -> PageLeaf {
    let page = sequence[position]
    let made = PageLeaf(
      position: position,
      address: page.flatMap { pages.indices.contains($0) ? pages[$0] : nil },
      pictures: pictures,
      paper: paper,
      isZoomedAlone: !isTwoUp
    )

    made.fit = fit

    made.onZoom = { [weak self] isZoomed in
      self?.holdStill(isZoomed)
    }
    made.onEdge = { [weak self] in
      self?.tellThePaper()
    }

    return made
  }

  /// Turns to a place in the sequence, curling there where asked to.
  private func show(
    at position: Int, direction: UIPageViewController.NavigationDirection, isAnimated: Bool
  ) {
    let shown = leaves(at: position)

    guard let pager, !shown.isEmpty else {
      return
    }

    if closeness != 1 {
      comeBack(isAnimated: false)
    }

    pager.setViewControllers(shown, direction: direction, animated: isAnimated) { [weak self] _ in
      self?.tellTheTurn()
    }
    fetchAround(position)

    if !isAnimated {
      tellTheTurn()
    }
  }

  /// Says which page of the book is showing — the earliest where a spread shows two.
  private func tellTheTurn() {
    let showing = leavesShowing().compactMap { sequence[$0.position] }

    guard let earliest = showing.min() else {
      return
    }

    wanted = earliest
    onTurn(["page": earliest])
    tellThePaper()
  }

  /// Says the colour round the edge of the page showing — the first of a spread that has one — so
  /// whatever is drawn about the book can take it on, once it is known and whenever it changes.
  private func tellThePaper() {
    guard let edge = leavesShowing().compactMap(\.edge).first else {
      return
    }

    let hex = edge.hexadecimal

    backgroundColor = edge
    pager?.view.backgroundColor = edge

    guard hex != toldPaper else {
      return
    }

    toldPaper = hex
    onPaper(["colour": hex])
  }

  /// Fetches the pages either side of a place ahead of their being turned to.
  private func fetchAround(_ position: Int) {
    for near in (position - 4)...(position + 5) where sequence.indices.contains(near) {
      if let page = sequence[near], pages.indices.contains(page) {
        pictures.fetch(pages[page]) { _ in }
      }
    }
  }

  /// Stops the page turning while it is pinched closer or the book is locked, and lets it turn again
  /// once neither holds.
  private func holdStill(_ zoomed: Bool) {
    isZoomed = zoomed

    for recognizer in pager?.gestureRecognizers ?? [] where !(recognizer is UITapGestureRecognizer) {
      recognizer.isEnabled = !zoomed && !isLocked
    }
  }

  /// A tap on the page: the outer thirds turn it the way a finger there would, and the middle, or
  /// anywhere on a page looked at closely or locked, says so instead.
  @objc private func tapped(_ tap: UITapGestureRecognizer) {
    let across = tap.location(in: self).x / max(bounds.width, 1)

    guard !isZoomed, !isLocked, across < 1 / 3 || across > 2 / 3, let at = positionShowing() else {
      onMiddle([:])

      return
    }

    let step = (across > 2 / 3 ? 1 : -1) * (isTwoUp ? 2 : 1)
    let to = at + step

    guard sequence.indices.contains(to) else {
      let isReadingOn = isRightToLeft ? step < 0 : step > 0

      if isReadingOn {
        onPastTheEnd([:])
      }

      return
    }

    show(at: to, direction: step > 0 ? .forward : .reverse, isAnimated: true)
  }

  /// A pinch on a spread: both pages drawn closer together, about the point between the fingers,
  /// which stays under them as they spread or close. A spread already shown whole is not drawn any
  /// smaller, so pinching it closed does nothing at all.
  @objc private func pinched(_ pinch: UIPinchGestureRecognizer) {
    let middle = CGPoint(x: bounds.midX, y: bounds.midY)
    let at = pinch.location(in: self)

    switch pinch.state {
    case .began:
      pinchedFrom = closeness
      pinchedAt = CGPoint(
        x: middle.x + (at.x - middle.x - shift.x) / closeness,
        y: middle.y + (at.y - middle.y - shift.y) / closeness
      )
    case .changed:
      let wanted = pinchedFrom * pinch.scale

      guard stage != nil || wanted > 1.04 else {
        return
      }

      if stage == nil {
        holdStill(true)
        raiseTheStage()
      }

      closeness = min(max(wanted, 1), 5)
      shift = CGPoint(
        x: at.x - middle.x - closeness * (pinchedAt.x - middle.x),
        y: at.y - middle.y - closeness * (pinchedAt.y - middle.y)
      )
      draw()
    default:
      guard stage != nil else {
        return
      }

      if closeness < 1.05 {
        comeBack(isAnimated: true)
      } else {
        across.isEnabled = true
      }
    }
  }

  /// A drag on a spread drawn closer, moving it about under the finger.
  @objc private func panned(_ pan: UIPanGestureRecognizer) {
    let moved = pan.translation(in: self)

    pan.setTranslation(.zero, in: self)
    shift = CGPoint(x: shift.x + moved.x, y: shift.y + moved.y)
    draw()
  }

  /// Draws the spread as close as it has been brought, moved no further than keeps its edges past
  /// the book's.
  private func draw() {
    let reachX = (closeness - 1) * bounds.width / 2
    let reachY = (closeness - 1) * bounds.height / 2

    shift = CGPoint(x: min(max(shift.x, -reachX), reachX), y: min(max(shift.y, -reachY), reachY))
    stage?.transform = CGAffineTransform(translationX: shift.x, y: shift.y)
      .scaledBy(x: closeness, y: closeness)
  }

  /// Lays a still of the pages showing over the book, each page's own picture where its leaf is,
  /// for a pinch to draw closer. The page curl draws its pages in layers of its own that do not
  /// follow the book being drawn larger, so the still is what is drawn larger instead, and the book
  /// is hidden under it until the pinch lets go.
  private func raiseTheStage() {
    guard stage == nil, let pager else {
      return
    }

    let still = UIView(frame: bounds)

    still.backgroundColor = backgroundColor
    still.isUserInteractionEnabled = false

    for leaf in leavesShowing() {
      let place = leaf.view.convert(leaf.view.bounds, to: self)
      let page = UIImageView(frame: place)

      page.image = leaf.shownPicture
      page.contentMode = .scaleAspectFit
      page.backgroundColor = leaf.edge ?? paper
      page.accessibilityIgnoresInvertColors = true
      still.addSubview(page)
    }

    addSubview(still)
    pager.view.isHidden = true
    stage = still
  }

  /// Puts the spread back as it was, and lets the pages turn again.
  private func comeBack(isAnimated: Bool) {
    closeness = 1
    shift = .zero
    across.isEnabled = false

    let still = stage

    stage = nil
    UIView.animate(
      withDuration: isAnimated ? 0.25 : 0,
      animations: {
        still?.transform = .identity
      },
      completion: { _ in
        self.pager?.view.isHidden = false
        still?.removeFromSuperview()
      }
    )
    holdStill(false)
  }

  public func gestureRecognizer(
    _ gestureRecognizer: UIGestureRecognizer,
    shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer
  ) -> Bool {
    true
  }

  public func pageViewController(
    _ pageViewController: UIPageViewController,
    viewControllerBefore viewController: UIViewController
  ) -> UIViewController? {
    guard let at = (viewController as? PageLeaf)?.position, sequence.indices.contains(at - 1)
    else {
      return nil
    }

    return leaf(at: at - 1)
  }

  public func pageViewController(
    _ pageViewController: UIPageViewController,
    viewControllerAfter viewController: UIViewController
  ) -> UIViewController? {
    guard let at = (viewController as? PageLeaf)?.position, sequence.indices.contains(at + 1)
    else {
      return nil
    }

    return leaf(at: at + 1)
  }

  public func pageViewController(
    _ pageViewController: UIPageViewController,
    didFinishAnimating finished: Bool,
    previousViewControllers: [UIViewController],
    transitionCompleted completed: Bool
  ) {
    guard completed else {
      return
    }

    tellTheTurn()

    if let at = positionShowing() {
      fetchAround(at)
    }
  }
}

/// One page of the book: its picture, fitted to the leaf and pinchable closer, on the book's paper.
/// A leaf with no address is the blank page that pads out a spread.
private final class PageLeaf: UIViewController, UIScrollViewDelegate {
  let position: Int
  var onZoom: ((Bool) -> Void)?
  var onEdge: (() -> Void)?
  private(set) var edge: UIColor?
  var fit: PageFit = .both {
    didSet {
      if fit != oldValue, isViewLoaded {
        fitThePicture()
      }
    }
  }
  var paper: UIColor {
    didSet {
      view.backgroundColor = edge ?? paper
    }
  }

  private let address: String?
  private let isZoomedAlone: Bool

  /// The page's picture as it is drawn, for a still of the spread.
  var shownPicture: UIImage? {
    picture.image
  }
  private let pictures: PagePictures
  private let closer = UIScrollView()
  private let picture = UIImageView()
  private let waiting = UIActivityIndicatorView(style: .medium)

  init(
    position: Int, address: String?, pictures: PagePictures, paper: UIColor, isZoomedAlone: Bool
  ) {
    self.isZoomedAlone = isZoomedAlone
    self.position = position
    self.address = address
    self.pictures = pictures
    self.paper = paper

    super.init(nibName: nil, bundle: nil)
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    nil
  }

  override func viewDidLoad() {
    super.viewDidLoad()

    view.backgroundColor = paper
    closer.delegate = self
    closer.minimumZoomScale = 1
    closer.maximumZoomScale = 5
    closer.bouncesZoom = false
    closer.pinchGestureRecognizer?.isEnabled = isZoomedAlone
    closer.showsVerticalScrollIndicator = false
    closer.showsHorizontalScrollIndicator = false
    closer.contentInsetAdjustmentBehavior = .never
    picture.contentMode = .scaleAspectFit
    picture.accessibilityIgnoresInvertColors = true
    waiting.color = .gray
    waiting.hidesWhenStopped = true
    closer.addSubview(picture)
    view.addSubview(closer)
    view.addSubview(waiting)

    guard let address else {
      return
    }

    if let known = pictures.known(address) {
      lay(known)

      return
    }

    waiting.startAnimating()
    pictures.fetch(address) { [weak self] got in
      self?.waiting.stopAnimating()

      if let got {
        self?.lay(got)
      }
    }
  }

  /// Lays the page's picture down on paper the colour of its own edge, so the room round a page that
  /// does not fill the leaf reads as more of the page rather than a band of something else.
  private func lay(_ got: PagePicture) {
    picture.image = got.image
    edge = got.edge
    view.backgroundColor = got.edge ?? paper
    fitThePicture()
    onEdge?()
  }

  /// How far the picture is drawn in to fill the leaf the way asked: nothing for the whole page, or
  /// enough to fill the leaf's width or height, the rest scrolled to.
  private var fitting: CGFloat {
    guard let size = picture.image?.size, size.width > 0, size.height > 0 else {
      return 1
    }

    let room = closer.bounds.size
    let whole = min(room.width / size.width, room.height / size.height)
    let drawn = CGSize(width: size.width * whole, height: size.height * whole)

    switch fit {
    case .both:
      return 1
    case .width:
      return max(room.width / max(drawn.width, 1), 1)
    case .height:
      return max(room.height / max(drawn.height, 1), 1)
    }
  }

  /// Draws the picture in as far as the fit asks, from its top and its leading edge.
  private func fitThePicture() {
    guard closer.bounds.width > 0 else {
      return
    }

    closer.setZoomScale(fitting, animated: false)
    closer.contentOffset = .zero
  }

  override func viewDidLayoutSubviews() {
    super.viewDidLayoutSubviews()

    closer.frame = view.bounds
    waiting.center = CGPoint(x: view.bounds.midX, y: view.bounds.midY)

    if closer.zoomScale == 1 {
      picture.frame = closer.bounds
      closer.contentSize = closer.bounds.size
      fitThePicture()
    }
  }

  override func viewWillDisappear(_ animated: Bool) {
    super.viewWillDisappear(animated)

    fitThePicture()
  }

  func viewForZooming(in scrollView: UIScrollView) -> UIView? {
    picture
  }

  func scrollViewDidEndZooming(_ scrollView: UIScrollView, with view: UIView?, atScale scale: CGFloat) {
    onZoom?(scale > fitting * 1.01)
  }
}

/// The pictures of a book's pages, fetched once and kept while there is memory for them, with every
/// wait for the same page answered by the one fetch.
private final class PagePictures {
  private let kept = NSCache<NSString, PagePicture>()
  private var waiting: [String: [(PagePicture?) -> Void]] = [:]

  init() {
    kept.countLimit = 40
  }

  func known(_ address: String) -> PagePicture? {
    kept.object(forKey: address as NSString)
  }

  /// Fetches a page's picture, drawn ready for the screen and its edge colour read off the main
  /// thread, and answers on it.
  func fetch(_ address: String, then: @escaping (PagePicture?) -> Void) {
    if let got = known(address) {
      then(got)

      return
    }

    if waiting[address] != nil {
      waiting[address]?.append(then)

      return
    }

    guard let url = URL(string: address) else {
      then(nil)

      return
    }

    waiting[address] = [then]
    URLSession.shared.dataTask(with: url) { [weak self] data, _, _ in
      let got = data.flatMap(UIImage.init(data:))?.preparingForDisplay().map {
        PagePicture(image: $0, edge: $0.edgeColour())
      }

      DispatchQueue.main.async {
        guard let self else {
          return
        }

        if let got {
          self.kept.setObject(got, forKey: address as NSString)
        }

        let answers = self.waiting.removeValue(forKey: address) ?? []

        for answer in answers {
          answer(got)
        }
      }
    }.resume()
  }
}

/// How a page's picture fills its leaf: whole, or filling the leaf's width or its height.
enum PageFit: String {
  case both
  case width
  case height
}

/// A page's picture, and the colour round its edge.
private final class PagePicture {
  let image: UIImage
  let edge: UIColor?

  init(image: UIImage, edge: UIColor?) {
    self.image = image
    self.edge = edge
  }
}

extension UIImage {
  /// The colour most of the outermost pixels share — the paper a printed page is on, or the ink of
  /// one that bleeds to its edge — rather than their average, which panel lines and gutters along
  /// the edge would pull towards grey.
  ///
  /// The edge is read from the picture drawn small, its pixels sorted into buckets of like colour,
  /// and the fullest bucket's pixels averaged, so the colour is exactly the paper's and not the
  /// bucket's.
  fileprivate func edgeColour() -> UIColor? {
    guard let whole = cgImage else {
      return nil
    }

    let side = 64
    var pixels = [UInt8](repeating: 0, count: side * side * 4)
    let drawn = pixels.withUnsafeMutableBytes { bytes -> Bool in
      guard
        let context = CGContext(
          data: bytes.baseAddress,
          width: side,
          height: side,
          bitsPerComponent: 8,
          bytesPerRow: side * 4,
          space: CGColorSpaceCreateDeviceRGB(),
          bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
        )
      else {
        return false
      }

      context.interpolationQuality = .none
      context.draw(whole, in: CGRect(x: 0, y: 0, width: side, height: side))

      return true
    }

    guard drawn else {
      return nil
    }

    var buckets: [Int: (red: Int, green: Int, blue: Int, count: Int)] = [:]
    let rim = 2

    for y in 0..<side {
      for x in 0..<side where x < rim || y < rim || x >= side - rim || y >= side - rim {
        let at = (y * side + x) * 4
        let red = Int(pixels[at])
        let green = Int(pixels[at + 1])
        let blue = Int(pixels[at + 2])
        let bucket = (red >> 4) << 8 | (green >> 4) << 4 | (blue >> 4)
        let was = buckets[bucket] ?? (0, 0, 0, 0)

        buckets[bucket] = (was.red + red, was.green + green, was.blue + blue, was.count + 1)
      }
    }

    guard let fullest = buckets.values.max(by: { $0.count < $1.count }) else {
      return nil
    }

    let whole255 = CGFloat(fullest.count * 255)

    return UIColor(
      red: CGFloat(fullest.red) / whole255,
      green: CGFloat(fullest.green) / whole255,
      blue: CGFloat(fullest.blue) / whole255,
      alpha: 1
    )
  }
}

extension UIColor {
  /// The colour as `#rrggbb`, the way TypeScript is handed colours.
  fileprivate var hexadecimal: String {
    var red: CGFloat = 0
    var green: CGFloat = 0
    var blue: CGFloat = 0

    getRed(&red, green: &green, blue: &blue, alpha: nil)

    return String(
      format: "#%02x%02x%02x",
      Int((red * 255).rounded()),
      Int((green * 255).rounded()),
      Int((blue * 255).rounded())
    )
  }
}
