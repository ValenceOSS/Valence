import ExpoModulesCore
import SceneKit
import UIKit

/// Pages turned by bending them over wherever the finger takes them, drawn matte.
///
/// The system's page curl lays a white sheen over every page it turns, which reads as light on
/// paper on a white page and as a glowing streak on a dark one. This draws the turn itself: the page
/// is a fine mesh, folded over a cylinder whose axis is the line halfway between where the page was
/// taken hold of and where the finger is now, so a page lifted by its top corner peels from the top,
/// by its bottom corner from the bottom, by the middle of its edge straight across — and can be
/// folded at any angle in between. The part past the fold lies on its back in the paper's colour.
///
/// It is lit by one light straight in front and nothing else, with no shine: paper lying flat is
/// exactly its own colour, and only the bend darkens as it turns away, so a black page turns as
/// quietly as a white one.
///
/// It is handed either the address of every page's picture, or a chapter's text and how to set it,
/// which it lays out in pages and draws itself, and which page to show. It says how many pages a
/// chapter made, when a page was turned, when the middle of the page was tapped, and when somebody
/// tried to turn past either end, so the reader can open the part of the book that comes next or
/// before.
public class ValenceMatteCurlModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ValenceMatteCurl")

    View(ValenceMatteCurlView.self) {
      Events("onTurn", "onMiddle", "onPastTheEnd", "onBeforeTheStart", "onGrab", "onPages")

      Prop("pages") { (view: ValenceMatteCurlView, pages: [String]) in
        view.givenPages = pages
      }

      Prop("book") { (view: ValenceMatteCurlView, book: String?) in
        view.book = book
      }

      Prop("bookLook") { (view: ValenceMatteCurlView, look: [String: Any]?) in
        view.bookLook = look
      }

      Prop("ink") { (view: ValenceMatteCurlView, ink: UIColor?) in
        view.ink = ink
      }

      Prop("page") { (view: ValenceMatteCurlView, page: Int) in
        view.wanted = page
      }

      Prop("paper") { (view: ValenceMatteCurlView, paper: UIColor?) in
        view.paper = paper ?? .black
      }

      Prop("isLocked") { (view: ValenceMatteCurlView, isLocked: Bool?) in
        view.isLocked = isLocked ?? false
      }

      Prop("isAnimated") { (view: ValenceMatteCurlView, isAnimated: Bool?) in
        view.isAnimated = isAnimated ?? true
      }

      OnViewDidUpdateProps { (view: ValenceMatteCurlView) in
        view.settle()
      }
    }
  }
}

/// Which way a turn goes: on to the next page, or back to the one before.
private enum TurnWay {
  case onward
  case back
}

/// The book: the page showing, drawn as a mesh that folds, and the page beneath it while a turn is
/// under way.
public class ValenceMatteCurlView: ExpoView, UIGestureRecognizerDelegate {
  let onTurn = EventDispatcher()
  let onMiddle = EventDispatcher()
  let onPastTheEnd = EventDispatcher()
  let onBeforeTheStart = EventDispatcher()
  let onGrab = EventDispatcher()
  let onPages = EventDispatcher()

  var givenPages: [String] = []
  var book: String?
  var bookLook: [String: Any]?
  var ink: UIColor?
  private var pages: [String] = []
  private var typeset: TypesetBook?
  private var typesetFor = ""
  private var typesetting = 0
  var wanted = 0
  var paper: UIColor = .black
  var isLocked = false
  var isAnimated = true

  private static let columns = 26
  private static let rows = 38
  private static let settleSeconds: CFTimeInterval = 0.26
  private static let lampTilt = (x: Float(-0.25), y: Float(0.35))
  private static let lampStrength: CGFloat = 700
  /// The ambient light that, with the lamp falling on paper lying flat, makes that paper exactly its
  /// own colour, so only what is lifted or turned away is shaded.
  private static let ambientStrength: CGFloat =
    1000 - lampStrength * CGFloat(cos(lampTilt.x) * cos(lampTilt.y))
  private static let flickSpeed: CGFloat = 320
  private static let jumpsPast: CGFloat = 40

  private let scene = SCNScene()
  private let sceneView = SCNView()
  private let camera = SCNNode()
  private let beneath = SCNNode()
  private let front = SCNNode()
  private let back = SCNNode()
  private var frontLook = ValenceMatteCurlView.look(nil)
  private var backLook = ValenceMatteCurlView.look(nil)
  private var beneathLook = ValenceMatteCurlView.look(nil)
  private let looks = NSCache<NSString, PageLooks>()
  private var lookedWith: UIColor?
  private let pictures = NSCache<NSString, UIImage>()
  private let backs = NSCache<NSString, UIImage>()

  private var showing = 0
  private var turning: TurnWay?
  private var turnLeaves: (top: Int, under: Int)?
  private var held = CGPoint.zero
  private var corner = CGPoint.zero
  private var grabbedAt = CGPoint.zero
  private var cornerFrom = CGPoint.zero
  private var settling: (from: CGPoint, to: CGPoint, began: CFTimeInterval, completes: Bool)?
  private var ticker: CADisplayLink?
  private var grid: (texture: SCNGeometrySource, front: SCNGeometryElement, back: SCNGeometryElement)?
  private var laidFor = CGSize.zero
  private var dressedAs = ""

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)

    clipsToBounds = true

    sceneView.scene = scene
    sceneView.backgroundColor = .black
    sceneView.isOpaque = true
    sceneView.antialiasingMode = .multisampling2X
    sceneView.isUserInteractionEnabled = false
    sceneView.rendersContinuously = false
    addSubview(sceneView)

    let lens = SCNCamera()

    lens.usesOrthographicProjection = true
    lens.zNear = 1
    lens.zFar = 6000
    camera.camera = lens
    camera.position = SCNVector3(0, 0, 3000)
    scene.rootNode.addChildNode(camera)
    sceneView.pointOfView = camera

    let light = SCNNode()
    let lamp = SCNLight()

    lamp.type = .directional
    lamp.intensity = Self.lampStrength
    lamp.color = UIColor.white
    lamp.castsShadow = true
    lamp.shadowMode = .forward
    lamp.shadowRadius = 10
    lamp.shadowSampleCount = 8
    lamp.shadowColor = UIColor.black.withAlphaComponent(0.42)
    lamp.shadowBias = 4
    lamp.automaticallyAdjustsShadowProjection = true
    light.light = lamp
    light.eulerAngles = SCNVector3(Self.lampTilt.x, Self.lampTilt.y, 0)
    scene.rootNode.addChildNode(light)

    let room = SCNNode()
    let fill = SCNLight()

    fill.type = .ambient
    fill.color = UIColor.white
    fill.intensity = Self.ambientStrength
    room.light = fill
    scene.rootNode.addChildNode(room)

    beneath.geometry = SCNPlane(width: 1, height: 1)
    beneath.geometry?.materials = [beneathLook]
    beneath.position = SCNVector3(0, 0, -1)
    scene.rootNode.addChildNode(beneath)
    scene.rootNode.addChildNode(front)
    scene.rootNode.addChildNode(back)

    let pan = UIPanGestureRecognizer(target: self, action: #selector(panned(_:)))

    pan.delegate = self
    pan.maximumNumberOfTouches = 1
    addGestureRecognizer(pan)

    let tap = UITapGestureRecognizer(target: self, action: #selector(tapped(_:)))

    tap.require(toFail: pan)
    addGestureRecognizer(tap)
  }

  public override func layoutSubviews() {
    super.layoutSubviews()

    sceneView.frame = bounds

    guard bounds.size != laidFor, bounds.width > 0, bounds.height > 0 else {
      return
    }

    laidFor = bounds.size
    camera.camera?.orthographicScale = Double(bounds.height / 2)
    beneath.scale = SCNVector3(Float(bounds.width), Float(bounds.height), 1)
    grid = nil
    flatten()

    if book != nil {
      typesetIfChanged()
    }
  }

  /// Lays the chapter out again, away from the main thread, where its text, its look or the size of
  /// the page has changed since it was last laid out; then lists its pages and says how many there
  /// are and which page each named place is on.
  private func typesetIfChanged() {
    guard
      let book, bounds.width > 0, bounds.height > 0,
      let given = bookLook,
      let look = TypesetLook(given, ink: ink, paper: paper)
    else {
      return
    }

    let size = bounds.size
    let wanted = "\(book.hashValue)|\(String(describing: given))|\(size)|\(paper)|\(String(describing: ink))"

    guard wanted != typesetFor else {
      return
    }

    typesetFor = wanted
    typesetting += 1

    let run = typesetting
    let scale = traitCollection.displayScale

    DispatchQueue.global(qos: .userInitiated).async { [weak self] in
      let blocks = (try? JSONDecoder().decode([TypesetBlock].self, from: Data(book.utf8))) ?? []
      let made = TypesetBook(blocks: blocks, look: look, size: size, scale: scale)

      DispatchQueue.main.async {
        guard let self, run == self.typesetting else {
          return
        }

        self.typeset = made
        self.pages = made.frames.indices.map { "typeset:\(run):\($0)" }
        self.dressedAs = ""
        self.onPages(["count": made.frames.count, "anchors": made.anchors])
        self.settle()
      }
    }
  }

  /// A page's picture: drawn by the chapter's typesetting where the page is one of its pages, and
  /// read from where it was saved otherwise. Safe away from the main thread.
  private static func picture(for address: String, from book: TypesetBook?) -> UIImage? {
    if address.hasPrefix("typeset:") {
      guard let at = address.split(separator: ":").last.flatMap({ Int($0) }) else {
        return nil
      }

      return book?.draw(page: at)
    }

    let path = URL(string: address)?.path ?? address

    return UIImage(contentsOfFile: path)?.preparingForDisplay()
  }

  /// Brings the book up to date with what it was last handed, unless a page is being turned, in
  /// which case it is brought up to date when the turn ends.
  func settle() {
    backgroundColor = paper
    sceneView.backgroundColor = paper

    if book == nil {
      if pages != givenPages {
        pages = givenPages
      }
    } else {
      typesetIfChanged()
    }

    if lookedWith != paper {
      lookedWith = paper
      looks.removeAllObjects()
      backs.removeAllObjects()
      dressedAs = ""
    }

    if let leaves = turnLeaves, turning != nil || settling != nil {
      dress(top: leaves.top, under: leaves.under)

      return
    }

    guard turning == nil, settling == nil else {
      return
    }

    let settled = pages.isEmpty ? 0 : min(max(wanted, 0), pages.count - 1)
    let wasFlat = corner == held && settled == showing

    showing = settled
    dress(top: showing, under: nil)

    if !wasFlat {
      flatten()
    }
  }

  public override func gestureRecognizerShouldBegin(_ gestureRecognizer: UIGestureRecognizer) -> Bool {
    guard let pan = gestureRecognizer as? UIPanGestureRecognizer else {
      return true
    }

    let speed = pan.velocity(in: self)

    return !isLocked && abs(speed.x) > abs(speed.y) * 0.6
  }

  @objc private func tapped(_ tap: UITapGestureRecognizer) {
    let at = tap.location(in: self)
    let across = at.x / max(bounds.width, 1)

    guard !isLocked, turning == nil, settling == nil, across < 1 / 3 || across > 2 / 3 else {
      onMiddle([:])

      return
    }

    let way: TurnWay = across > 2 / 3 ? .onward : .back

    if !isAnimated {
      jump(way)

      return
    }
    let low = CGPoint(x: bounds.width, y: bounds.height * 0.82)

    guard begin(way, from: low) else {
      return
    }

    run(to: way == .onward ? turnedCorner(for: low) : held, completes: true)
  }

  @objc private func panned(_ pan: UIPanGestureRecognizer) {
    let finger = pan.location(in: self)
    let speed = pan.velocity(in: self).x

    if !isAnimated {
      if pan.state == .ended {
        let moved = pan.translation(in: self).x

        if abs(moved) > Self.jumpsPast || abs(speed) > Self.flickSpeed {
          jump(moved < 0 ? .onward : .back)
        }
      }

      return
    }

    switch pan.state {
    case .began:
      grabbedAt = finger
      _ = begin(
        speed < 0 ? .onward : .back,
        from: speed < 0 ? finger : CGPoint(x: bounds.width, y: finger.y)
      )
    case .changed:
      guard turning != nil else {
        return
      }

      corner = bound(
        CGPoint(
          x: min(
            max(cornerFrom.x + (finger.x - grabbedAt.x) * (turning == .back ? 2 : 1), -bounds.width * 2),
            held.x
          ),
          y: cornerFrom.y + (finger.y - grabbedAt.y)
        )
      )
      draw()
    case .ended, .cancelled, .failed:
      guard let turning else {
        return
      }

      let goneHalf = corner.x < 0
      let completes =
        pan.state == .ended
        && (turning == .onward
          ? speed < -Self.flickSpeed || (speed < Self.flickSpeed && goneHalf)
          : speed > Self.flickSpeed || (speed > -Self.flickSpeed && !goneHalf))
      let flat = (turning == .onward) == completes ? turnedCorner(for: held) : held

      run(to: flat, completes: completes)
    default:
      break
    }
  }

  /// Keeps the corner held where paper bound at its spine can reach: never further from the top or
  /// the bottom of the spine than it started, so the page swings round its binding rather than being
  /// pulled down or off it. Once it is past the spine it is all but turned, and it is let be.
  private func bound(_ point: CGPoint) -> CGPoint {
    guard point.x >= 0 else {
      return point
    }

    var kept = point

    for spine in [CGPoint(x: 0, y: 0), CGPoint(x: 0, y: bounds.height)] {
      let reach = hypot(held.x - spine.x, held.y - spine.y)
      let away = hypot(kept.x - spine.x, kept.y - spine.y)

      if away > reach, away > 0 {
        kept = CGPoint(
          x: spine.x + (kept.x - spine.x) * reach / away,
          y: spine.y + (kept.y - spine.y) * reach / away
        )
      }
    }

    return kept
  }

  /// Turns a page at once, with no curl, for somebody who has asked for pages not to be animated;
  /// or says the book has run out that way.
  private func jump(_ way: TurnWay) {
    guard turning == nil, settling == nil, !pages.isEmpty else {
      return
    }

    let to = way == .onward ? showing + 1 : showing - 1

    guard pages.indices.contains(to) else {
      if way == .onward {
        onPastTheEnd([:])
      } else {
        onBeforeTheStart([:])
      }

      return
    }

    showing = to
    onTurn(["page": showing])
    dress(top: showing, under: nil)
    flatten()
  }

  /// How round the bend is, which grows with the page so a larger page bends more gently.
  private var radius: CGFloat {
    max(bounds.width * 0.07, 18)
  }

  /// Where the point held has to go for the whole page to have turned over and off the left edge:
  /// the fold, halfway between the two, has then passed the spine.
  private func turnedCorner(for hold: CGPoint) -> CGPoint {
    CGPoint(x: -hold.x - .pi * radius - 2 * radius - 8, y: hold.y)
  }

  /// Starts a turn, taking hold of the page where the finger touched it — or, turning back, the page
  /// before by its outer edge — or says the book has run out that way.
  ///
  /// - Returns: Whether a turn began.
  private func begin(_ way: TurnWay, from hold: CGPoint) -> Bool {
    guard turning == nil, settling == nil, !pages.isEmpty, bounds.width > 0 else {
      return false
    }

    if way == .onward {
      guard showing + 1 < pages.count else {
        onPastTheEnd([:])

        return false
      }

      dress(top: showing, under: showing + 1)
      turnLeaves = (top: showing, under: showing + 1)
      held = hold
      corner = hold
    } else {
      guard showing > 0 else {
        onBeforeTheStart([:])

        return false
      }

      dress(top: showing - 1, under: showing)
      turnLeaves = (top: showing - 1, under: showing)
      held = hold
      corner = turnedCorner(for: hold)
    }

    turning = way
    cornerFrom = corner
    sceneView.isPlaying = true
    draw()
    onGrab([:])

    return true
  }

  /// Carries the corner to where it is going over a moment, easing out, and then ends the turn.
  private func run(to goal: CGPoint, completes: Bool) {
    settling = (from: corner, to: goal, began: CACurrentMediaTime(), completes: completes)
    ticker?.invalidate()

    let made = CADisplayLink(target: self, selector: #selector(ticked))

    made.add(to: .main, forMode: .common)
    ticker = made
  }

  @objc private func ticked() {
    guard let settling else {
      ticker?.invalidate()
      ticker = nil

      return
    }

    let through = min((CACurrentMediaTime() - settling.began) / Self.settleSeconds, 1)
    let eased = CGFloat(1 - pow(1 - through, 3))

    corner = CGPoint(
      x: settling.from.x + (settling.to.x - settling.from.x) * eased,
      y: settling.from.y + (settling.to.y - settling.from.y) * eased
    )
    draw()

    guard through >= 1 else {
      return
    }

    ticker?.invalidate()
    ticker = nil
    self.settling = nil
    finish(completes: settling.completes)
  }

  /// Ends a turn: on the new page where it went through, back where it was where it did not, and
  /// says so where the page changed.
  private func finish(completes: Bool) {
    guard let way = turning else {
      return
    }

    turning = nil
    turnLeaves = nil

    if completes {
      showing = way == .onward ? showing + 1 : showing - 1
      onTurn(["page": showing])
    }

    let under = beneath.isHidden ? nil : Optional(showing)

    dress(top: showing, under: under)
    flatten()

    DispatchQueue.main.asyncAfter(deadline: .now() + 0.08) { [weak self] in
      guard let self, self.turning == nil else {
        return
      }

      self.beneath.isHidden = true
      self.sceneView.isPlaying = false
    }
  }

  /// Lays the page flat, as it lies between turns.
  private func flatten() {
    held = CGPoint(x: bounds.width, y: bounds.height / 2)
    corner = held
    draw()
  }

  /// Puts pages' pictures on the page on top and the page beneath.
  private func dress(top: Int, under: Int?) {
    let wanted = [
      pages.indices.contains(top) ? pages[top] : "",
      under.flatMap { pages.indices.contains($0) ? pages[$0] : nil } ?? "-",
      paper.description,
    ].joined(separator: "|")

    guard wanted != dressedAs else {
      return
    }

    dressedAs = wanted

    let upper = looksFor(top)

    frontLook = upper?.face ?? Self.look(paper)
    backLook = upper?.back ?? Self.look(paper)
    beneathLook = under.flatMap { looksFor($0)?.face } ?? Self.look(paper)
    beneath.geometry?.materials = [beneathLook]
    beneath.isHidden = under == nil
    front.geometry?.materials = [frontLook]
    back.geometry?.materials = [backLook]
    sceneView.setNeedsDisplay()

    warm(around: showing)
  }

  /// A matte material: lit only by how squarely it faces the light, with no shine.
  private static func look(_ contents: Any?) -> SCNMaterial {
    let made = SCNMaterial()

    made.lightingModel = .lambert
    made.locksAmbientWithDiffuse = true
    made.isDoubleSided = false
    made.specular.contents = UIColor.black
    made.diffuse.contents = contents

    return made
  }

  /// The face and back a page is drawn with, made once and kept, so turning to it never waits on a
  /// picture being drawn or handed to the graphics card.
  private func looksFor(_ page: Int) -> PageLooks? {
    guard pages.indices.contains(page), !pages[page].isEmpty else {
      return nil
    }

    let address = pages[page]

    if let known = looks.object(forKey: address as NSString) {
      return known
    }

    guard let face = image(at: page) else {
      return nil
    }

    let back = backs.object(forKey: address as NSString) ?? backOf(face, paper: paper)
    let made = PageLooks(face: Self.look(face), back: Self.look(back))

    looks.setObject(made, forKey: address as NSString)

    return made
  }

  /// The back of a page as it shows when the page is turned over: the paper a little darker than the
  /// front, with the words on the other side showing faintly through it, as they do through a page
  /// held up to the light.
  private func backOf(_ face: UIImage, paper: UIColor) -> UIImage {
    let format = UIGraphicsImageRendererFormat()

    format.scale = face.scale

    return UIGraphicsImageRenderer(size: face.size, format: format).image { drawing in
      let whole = CGRect(origin: .zero, size: face.size)

      paper.setFill()
      drawing.fill(whole)
      face.draw(in: whole, blendMode: .normal, alpha: 0.12)
      UIColor.black.withAlphaComponent(0.07).setFill()
      drawing.fill(whole, blendMode: .normal)
    }
    .preparingForDisplay() ?? face
  }

  /// A page's picture, read from where it was saved and kept while there is memory for it.
  private func image(at page: Int) -> UIImage? {
    guard pages.indices.contains(page), !pages[page].isEmpty else {
      return nil
    }

    let address = pages[page]

    if let known = pictures.object(forKey: address as NSString) {
      return known
    }

    guard let read = Self.picture(for: address, from: typeset) else {
      return nil
    }

    pictures.setObject(read, forKey: address as NSString)

    return read
  }

  /// Reads and decodes the pages either side of the one showing away from the main thread, so that
  /// taking hold of a page to turn it never waits on a picture being read.
  private func warm(around page: Int) {
    let wanted = [page, page - 1, page + 1, page + 2].compactMap { at -> String? in
      guard pages.indices.contains(at), !pages[at].isEmpty,
        looks.object(forKey: pages[at] as NSString) == nil
      else {
        return nil
      }

      return pages[at]
    }

    guard !wanted.isEmpty else {
      return
    }

    let paper = self.paper
    let book = typeset

    DispatchQueue.global(qos: .userInitiated).async { [weak self] in
      for address in wanted {
        guard let read = Self.picture(for: address, from: book), let self else {
          continue
        }

        let back = self.backOf(read, paper: paper)

        DispatchQueue.main.async {
          self.pictures.setObject(read, forKey: address as NSString)
          self.backs.setObject(back, forKey: address as NSString)

          guard self.looks.object(forKey: address as NSString) == nil else {
            return
          }

          let made = PageLooks(face: Self.look(read), back: Self.look(back))

          self.looks.setObject(made, forKey: address as NSString)
          self.sceneView.prepare([made.face, made.back], completionHandler: nil)
        }
      }
    }
  }

  /// Where a point of the page that lay at `point` is once the page is folded: flat on the near side
  /// of the fold, round the cylinder over it, and lying on its back past it. The fold runs square to
  /// the line from where the page was taken hold of to where that point has been carried, placed so
  /// the point held stays under the finger.
  private func folded(_ point: CGPoint, axisAt middle: CGPoint, toward out: CGPoint) -> (CGPoint, CGFloat) {
    let into = (point.x - middle.x) * out.x + (point.y - middle.y) * out.y
    let round = radius

    if into <= 0 {
      return (point, 0)
    }

    let foot = CGPoint(x: point.x - out.x * into, y: point.y - out.y * into)

    if into < .pi * round {
      let angle = into / round

      return (
        CGPoint(x: foot.x + out.x * round * sin(angle), y: foot.y + out.y * round * sin(angle)),
        round * (1 - cos(angle))
      )
    }

    let beyond = into - .pi * round

    return (CGPoint(x: foot.x - out.x * beyond, y: foot.y - out.y * beyond), 2 * round)
  }

  /// Folds the mesh to where the corner is, and draws it.
  private func draw() {
    let width = bounds.width
    let height = bounds.height

    guard width > 0, height > 0 else {
      return
    }

    let pull = CGPoint(x: held.x - corner.x, y: held.y - corner.y)
    let length = hypot(pull.x, pull.y)
    let isFlat = length < 0.5
    let out = isFlat ? CGPoint(x: 1, y: 0) : CGPoint(x: pull.x / length, y: pull.y / length)
    let middle =
      isFlat
      ? CGPoint(x: width * 4, y: 0)
      : CGPoint(
        x: (held.x + corner.x) / 2 + out.x * .pi * radius / 2,
        y: (held.y + corner.y) / 2 + out.y * .pi * radius / 2
      )

    let columns = Self.columns
    let rows = Self.rows
    var places: [SCNVector3] = []

    places.reserveCapacity((columns + 1) * (rows + 1))

    for row in 0...rows {
      for column in 0...columns {
        let point = CGPoint(
          x: width * CGFloat(column) / CGFloat(columns),
          y: height * CGFloat(row) / CGFloat(rows)
        )
        let (moved, lift) = folded(point, axisAt: middle, toward: out)

        places.append(
          SCNVector3(Float(moved.x - width / 2), Float(height / 2 - moved.y), Float(lift))
        )
      }
    }

    let normals = normalsOf(places, columns: columns, rows: rows)
    let flipped = normals.map { SCNVector3(-$0.x, -$0.y, -$0.z) }
    let shape = gridShape(columns: columns, rows: rows)
    let positions = SCNGeometrySource(vertices: places)
    let faceUp = SCNGeometry(
      sources: [positions, SCNGeometrySource(normals: normals), shape.texture],
      elements: [shape.front]
    )
    let faceDown = SCNGeometry(
      sources: [positions, SCNGeometrySource(normals: flipped), shape.texture],
      elements: [shape.back]
    )

    faceUp.materials = [frontLook]
    faceDown.materials = [backLook]

    SCNTransaction.begin()
    SCNTransaction.disableActions = true
    front.geometry = faceUp
    back.geometry = faceDown
    SCNTransaction.commit()

    sceneView.setNeedsDisplay()
  }

  /// The parts of the mesh that do not change as it folds: where each point takes its picture
  /// from, and the triangles, wound one way for the face and the other for the back.
  private func gridShape(columns: Int, rows: Int) -> (texture: SCNGeometrySource, front: SCNGeometryElement, back: SCNGeometryElement) {
    if let grid {
      return grid
    }

    var marks: [CGPoint] = []
    var faces: [Int32] = []
    var backs: [Int32] = []

    for row in 0...rows {
      for column in 0...columns {
        marks.append(CGPoint(x: CGFloat(column) / CGFloat(columns), y: CGFloat(row) / CGFloat(rows)))
      }
    }

    for row in 0..<rows {
      for column in 0..<columns {
        let topLeft = Int32(row * (columns + 1) + column)
        let topRight = topLeft + 1
        let bottomLeft = topLeft + Int32(columns + 1)
        let bottomRight = bottomLeft + 1

        faces += [topLeft, bottomLeft, topRight, topRight, bottomLeft, bottomRight]
        backs += [topLeft, topRight, bottomLeft, topRight, bottomRight, bottomLeft]
      }
    }

    let made = (
      texture: SCNGeometrySource(textureCoordinates: marks),
      front: SCNGeometryElement(indices: faces, primitiveType: .triangles),
      back: SCNGeometryElement(indices: backs, primitiveType: .triangles)
    )

    grid = made

    return made
  }

  /// Which way each point of the mesh faces, from the points around it, so the light falls on the
  /// bend as it would on paper.
  private func normalsOf(_ places: [SCNVector3], columns: Int, rows: Int) -> [SCNVector3] {
    let across = columns + 1

    return places.indices.map { at in
      let row = at / across
      let column = at % across
      let left = places[row * across + max(column - 1, 0)]
      let right = places[row * across + min(column + 1, columns)]
      let up = places[max(row - 1, 0) * across + column]
      let down = places[min(row + 1, rows) * across + column]
      let along = SCNVector3(right.x - left.x, right.y - left.y, right.z - left.z)
      let downward = SCNVector3(up.x - down.x, up.y - down.y, up.z - down.z)
      let facing = SCNVector3(
        along.y * downward.z - along.z * downward.y,
        along.z * downward.x - along.x * downward.z,
        along.x * downward.y - along.y * downward.x
      )
      let size = max(sqrt(facing.x * facing.x + facing.y * facing.y + facing.z * facing.z), 0.0001)

      return SCNVector3(facing.x / size, facing.y / size, facing.z / size)
    }
  }
}

/// The two sides a page is drawn with: its face, and its back as it shows when turned over.
private final class PageLooks {
  let face: SCNMaterial
  let back: SCNMaterial

  init(face: SCNMaterial, back: SCNMaterial) {
    self.face = face
    self.back = back
  }
}
