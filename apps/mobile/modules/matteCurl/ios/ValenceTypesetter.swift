import CoreText
import UIKit

/// A run of a paragraph's words in one style.
struct TypesetRun: Decodable {
  let text: String
  let isItalic: Bool
  let isBold: Bool
}

/// A picture in a book: where it is, and how large it is where the server measured it.
struct TypesetPicture: Decodable {
  let address: String
  let width: Double?
  let height: Double?
}

/// One block of a chapter: a paragraph, a heading, a quotation, a break or a picture, with the
/// places within it that the book's contents and links name.
struct TypesetBlock: Decodable {
  let kind: String
  let runs: [TypesetRun]
  let anchors: [String]
  let picture: TypesetPicture?
}

/// One part of a book, as the book keeps it in a file of its own: its blocks, and the name to show
/// above its pages.
struct TypesetPart: Decodable {
  let heading: String
  let blocks: [TypesetBlock]
}

/// A whole book to set: every part, in order, the cookie its pictures are read with, and whether
/// every part has arrived, or only those that were wanted first.
struct TypesetWholeBook: Decodable {
  let parts: [TypesetPart]
  let cookie: String?
  let isWhole: Bool
}

/// How a book is set: the type, how far apart its lines are, the room round it, the colours, and
/// the words below every page.
struct TypesetLook: Equatable {
  let fontSize: CGFloat
  let lineHeight: CGFloat
  let insetX: CGFloat
  let top: CGFloat
  let foot: CGFloat
  let headerCentre: CGFloat
  let footerCentre: CGFloat
  let ink: UIColor
  let paper: UIColor
  let regular: String
  let bold: String
  let italic: String
  let boldItalic: String
  let chrome: String
  let footer: String
  let isJustified: Bool

  /// Reads a look from what the reader handed over, or nothing where something it needs is missing.
  init?(_ given: [String: Any], ink: UIColor?, paper: UIColor?) {
    guard
      let fontSize = given["fontSize"] as? Double,
      let lineHeight = given["lineHeight"] as? Double,
      let insetX = given["insetX"] as? Double,
      let top = given["top"] as? Double,
      let foot = given["foot"] as? Double,
      let headerCentre = given["headerCentre"] as? Double,
      let footerCentre = given["footerCentre"] as? Double,
      let regular = given["regular"] as? String,
      let bold = given["bold"] as? String,
      let italic = given["italic"] as? String,
      let boldItalic = given["boldItalic"] as? String,
      let chrome = given["chrome"] as? String,
      let ink,
      let paper
    else {
      return nil
    }

    self.fontSize = CGFloat(fontSize)
    self.lineHeight = CGFloat(lineHeight)
    self.insetX = CGFloat(insetX)
    self.top = CGFloat(top)
    self.foot = CGFloat(foot)
    self.headerCentre = CGFloat(headerCentre)
    self.footerCentre = CGFloat(footerCentre)
    self.ink = ink
    self.paper = paper
    self.regular = regular
    self.bold = bold
    self.italic = italic
    self.boldItalic = boldItalic
    self.chrome = chrome
    self.footer = given["footer"] as? String ?? ""
    self.isJustified = given["isJustified"] as? Bool ?? true
  }
}

/// The pictures of a book, read once and kept while the app runs, so setting a book again in another
/// size or theme does not read them again.
enum TypesetPictures {
  private static let kept = NSCache<NSString, UIImage>()

  /// The pictures among some that have already been read, without waiting for any.
  static func known(_ addresses: Set<String>) -> [String: UIImage] {
    var found: [String: UIImage] = [:]

    for address in addresses {
      if let image = kept.object(forKey: address as NSString) {
        found[address] = image
      }
    }

    return found
  }

  /// Reads every picture not already kept, waiting for them all, and gives back each one found.
  static func read(_ addresses: Set<String>, cookie: String?) -> [String: UIImage] {
    var found: [String: UIImage] = [:]
    var wanted: [String] = []

    for address in addresses {
      if let image = kept.object(forKey: address as NSString) {
        found[address] = image
      } else {
        wanted.append(address)
      }
    }

    let group = DispatchGroup()
    let lock = NSLock()

    for address in wanted {
      guard let url = URL(string: address) else {
        continue
      }

      var request = URLRequest(url: url, timeoutInterval: 20)

      if let cookie {
        request.setValue(cookie, forHTTPHeaderField: "Cookie")
      }

      group.enter()
      URLSession.shared.dataTask(with: request) { data, _, _ in
        if let data, let image = UIImage(data: data)?.preparingForDisplay() {
          kept.setObject(image, forKey: address as NSString)
          lock.lock()
          found[address] = image
          lock.unlock()
        }

        group.leave()
      }.resume()
    }

    _ = group.wait(timeout: .now() + 30)

    lock.lock()
    defer { lock.unlock() }

    return found
  }
}

/// Where a picture is set in the text, read back when its page is drawn.
private let pictureKey = NSAttributedString.Key("ValencePicture")

/// The size a picture is set at, handed to Core Text while the lines are made.
private final class PictureBox {
  let size: CGSize

  init(size: CGSize) {
    self.size = size
  }
}

/// A book laid out in pages, as Apple Books lays one out: each part set with Core Text into a column
/// exactly a whole number of lines tall, so every page breaks between two lines, each part starting
/// on a page of its own and a part with nothing in it taking none, and each page drawn as a picture on
/// demand. Made and drawn away from the main thread; nothing in it changes once made, so it can be
/// read from any thread.
final class TypesetBook {
  let frames: [CTFrame]
  let partOfPage: [Int]
  let starts: [Int]
  let anchors: [String: Int]
  let headings: [String]
  let texts: [NSAttributedString]
  let pictures: [String: UIImage]
  let look: TypesetLook
  let size: CGSize
  let scale: CGFloat

  /// Lays a whole book out in pages of a given size.
  init(book: TypesetWholeBook, look: TypesetLook, size: CGSize, scale: CGFloat, pictures: [String: UIImage]) {
    self.look = look
    self.size = size
    self.scale = scale
    self.pictures = pictures
    self.headings = book.parts.map(\.heading)

    let column = CGSize(
      width: max(size.width - look.insetX * 2, 1),
      height: max(floor((size.height - look.top - look.foot) / look.lineHeight) * look.lineHeight, look.lineHeight)
    )
    let path = CGPath(rect: CGRect(origin: .zero, size: column), transform: nil)
    var laid = [(text: NSAttributedString, frames: [CTFrame], anchors: [String: Int])](
      repeating: (NSAttributedString(), [], [:]),
      count: book.parts.count
    )
    let lock = NSLock()

    DispatchQueue.concurrentPerform(iterations: book.parts.count) { at in
      let made = Self.lay(book.parts[at], look: look, column: column, path: path, pictures: pictures)

      lock.lock()
      laid[at] = made
      lock.unlock()
    }

    var frames: [CTFrame] = []
    var partOfPage: [Int] = []
    var starts: [Int] = []
    var anchors: [String: Int] = [:]

    for (at, part) in laid.enumerated() {
      starts.append(frames.count)
      anchors["\(at)#"] = frames.count

      for (name, page) in part.anchors {
        anchors["\(at)#\(name)"] = frames.count + page
      }

      frames.append(contentsOf: part.frames)
      partOfPage.append(contentsOf: Array(repeating: at, count: part.frames.count))
    }

    self.frames = frames
    self.partOfPage = partOfPage
    self.texts = laid.map(\.text)
    self.starts = starts
    self.anchors = anchors
  }

  /// Lays one part out in pages, and says which page each place it names is on.
  private static func lay(
    _ part: TypesetPart,
    look: TypesetLook,
    column: CGSize,
    path: CGPath,
    pictures: [String: UIImage]
  ) -> (text: NSAttributedString, frames: [CTFrame], anchors: [String: Int]) {
    let isOnlyPictures = part.blocks.allSatisfy { $0.kind == "picture" }
    let text = NSMutableAttributedString()
    var anchoredAt: [String: Int] = [:]

    for block in part.blocks {
      let starts = text.length

      for name in block.anchors {
        anchoredAt[name] = starts
      }

      if block.kind == "picture", let picture = block.picture {
        let image = pictures[picture.address]
        let measured = picture.width.flatMap { width in
          picture.height.map { CGSize(width: width, height: $0) }
        }

        if let size = image?.size ?? measured ?? (isOnlyPictures ? CGSize(width: column.width * 2, height: column.height * 2) : nil) {
          text.append(set(picture: picture.address, size: size, look: look, column: column, fillsThePage: isOnlyPictures))
        }
      } else {
        text.append(set(block, look: look))
      }
    }

    guard text.length > 0 else {
      return (text, [], [:])
    }

    let framesetter = CTFramesetterCreateWithAttributedString(text)
    var made: [CTFrame] = []
    var from = 0

    while from < text.length {
      let frame = CTFramesetterCreateFrame(framesetter, CFRange(location: from, length: 0), path, nil)
      let shown = CTFrameGetVisibleStringRange(frame)

      made.append(frame)
      from += max(shown.length, 1)
    }

    return (
      text,
      made,
      anchoredAt.mapValues { at in
        made.firstIndex { frame in
          let shown = CTFrameGetVisibleStringRange(frame)

          return at < shown.location + shown.length
        } ?? 0
      }
    )
  }

  /// A picture as text: a space the size the picture is set at, on a line of its own a whole number
  /// of lines tall, centred, and as large as the column allows where it is all its part holds. Its
  /// size is the picture's own, or what the server measured before the picture itself has arrived,
  /// so the page is the same whether it has or not.
  private static func set(
    picture address: String,
    size: CGSize,
    look: TypesetLook,
    column: CGSize,
    fillsThePage: Bool
  ) -> NSAttributedString {
    let natural = CGSize(width: max(size.width / 2, 1), height: max(size.height / 2, 1))
    let tallest = fillsThePage ? column.height : column.height - look.lineHeight
    let widest = fillsThePage ? column.width : min(column.width, natural.width)
    let shrink = min(widest / natural.width, max(tallest, look.lineHeight) / natural.height, fillsThePage ? .greatestFiniteMagnitude : 1)
    let shown = CGSize(width: floor(natural.width * shrink), height: floor(natural.height * shrink))
    let lineHeight = min(ceil(shown.height / look.lineHeight) * look.lineHeight, column.height)
    let style = NSMutableParagraphStyle()

    style.minimumLineHeight = lineHeight
    style.maximumLineHeight = lineHeight
    style.paragraphSpacing = fillsThePage ? 0 : look.lineHeight
    style.alignment = .center

    var callbacks = CTRunDelegateCallbacks(
      version: kCTRunDelegateVersion1,
      dealloc: { box in Unmanaged<PictureBox>.fromOpaque(box).release() },
      getAscent: { box in Unmanaged<PictureBox>.fromOpaque(box).takeUnretainedValue().size.height },
      getDescent: { _ in 0 },
      getWidth: { box in Unmanaged<PictureBox>.fromOpaque(box).takeUnretainedValue().size.width }
    )
    let box = Unmanaged.passRetained(PictureBox(size: shown)).toOpaque()

    guard let delegate = CTRunDelegateCreate(&callbacks, box) else {
      Unmanaged<PictureBox>.fromOpaque(box).release()

      return NSAttributedString()
    }

    let made = NSMutableAttributedString(
      string: "\u{FFFC}",
      attributes: [
        NSAttributedString.Key(kCTRunDelegateAttributeName as String): delegate,
        pictureKey: address,
        .paragraphStyle: style,
      ]
    )

    made.append(NSAttributedString(string: "\n", attributes: [.paragraphStyle: style]))

    return made
  }

  /// One block as text, in the type and spacing it is set in, ending with the break before the next.
  private static func set(_ block: TypesetBlock, look: TypesetLook) -> NSAttributedString {
    let scaleOfKind: CGFloat = block.kind == "title" ? 1.5 : block.kind == "heading" ? 1.3 : block.kind == "subheading" ? 1.15 : 1
    let isHeading = scaleOfKind > 1
    let fontSize = look.fontSize * scaleOfKind
    let lineHeight = isHeading ? ceil(fontSize * 1.25 / look.lineHeight) * look.lineHeight : look.lineHeight
    let style = NSMutableParagraphStyle()

    style.minimumLineHeight = lineHeight
    style.maximumLineHeight = lineHeight
    style.paragraphSpacing = look.lineHeight
    style.alignment = isHeading || !look.isJustified ? .natural : .justified
    style.hyphenationFactor = isHeading ? 0 : 0.6

    if block.kind == "quote" {
      style.headIndent = look.fontSize
      style.firstLineHeadIndent = look.fontSize
      style.tailIndent = -look.fontSize
    }

    let made = NSMutableAttributedString()

    for run in block.runs {
      let name =
        isHeading || run.isBold
        ? (run.isItalic || block.kind == "quote" ? look.boldItalic : look.bold)
        : (run.isItalic || block.kind == "quote" ? look.italic : look.regular)
      let font = UIFont(name: name, size: fontSize) ?? UIFont.systemFont(ofSize: fontSize)

      made.append(
        NSAttributedString(
          string: run.text,
          attributes: [.font: font, .foregroundColor: look.ink, .paragraphStyle: style]
        )
      )
    }

    if made.length == 0 {
      made.append(
        NSAttributedString(
          string: " ",
          attributes: [
            .font: UIFont(name: look.regular, size: fontSize) ?? UIFont.systemFont(ofSize: fontSize),
            .paragraphStyle: style,
          ]
        )
      )
    }

    made.append(NSAttributedString(string: "\n", attributes: [.paragraphStyle: style]))

    return made
  }

  /// Draws one page: the paper, the name of the part it is in above, its lines and pictures, and
  /// where it is in the book below.
  func draw(page: Int) -> UIImage? {
    guard frames.indices.contains(page) else {
      return nil
    }

    let format = UIGraphicsImageRendererFormat()

    format.scale = scale
    format.opaque = true

    return UIGraphicsImageRenderer(size: size, format: format).image { drawing in
      let context = drawing.cgContext

      look.paper.setFill()
      context.fill(CGRect(origin: .zero, size: size))

      let quiet = look.ink.withAlphaComponent(0.45)
      let chromeFont = UIFont(name: look.chrome, size: 13) ?? UIFont.systemFont(ofSize: 13, weight: .medium)
      let frame = frames[page]
      if !isOnlyPictures(page) {
        Self.centre(headings[partOfPage[page]], at: look.headerCentre, width: size.width, font: chromeFont, colour: quiet)
      }

      Self.centre(
        look.footer
          .replacingOccurrences(of: "{value}", with: String(page + 1))
          .replacingOccurrences(of: "{count}", with: String(frames.count)),
        at: look.footerCentre,
        width: size.width,
        font: chromeFont,
        colour: quiet
      )

      let column = CTFrameGetPath(frame).boundingBox

      context.saveGState()
      context.textMatrix = .identity
      context.translateBy(x: look.insetX, y: look.top + column.height)
      context.scaleBy(x: 1, y: -1)
      CTFrameDraw(frame, context)
      drawPictures(in: frame, on: context)
      context.restoreGState()
    }
    .preparingForDisplay()
  }

  /// Draws the pictures set on a page, each where its space was left in the lines.
  private func drawPictures(in frame: CTFrame, on context: CGContext) {
    guard let lines = CTFrameGetLines(frame) as? [CTLine], !lines.isEmpty else {
      return
    }

    var origins = [CGPoint](repeating: .zero, count: lines.count)

    CTFrameGetLineOrigins(frame, CFRange(location: 0, length: 0), &origins)

    for (line, origin) in zip(lines, origins) {
      guard let runs = CTLineGetGlyphRuns(line) as? [CTRun] else {
        continue
      }

      for run in runs {
        let attributes = CTRunGetAttributes(run) as NSDictionary

        guard
          let address = attributes[pictureKey] as? String,
          let image = pictures[address]?.cgImage
        else {
          continue
        }

        var ascent: CGFloat = 0
        let width = CGFloat(CTRunGetTypographicBounds(run, CFRange(location: 0, length: 0), &ascent, nil, nil))
        let x = origin.x + CTLineGetOffsetForStringIndex(line, CTRunGetStringRange(run).location, nil)

        context.draw(image, in: CGRect(x: x, y: origin.y, width: width, height: ascent))
      }
    }
  }

  /// Whether a page holds pictures and nothing else, as a cover does, which is drawn without the
  /// name of its part above it.
  private func isOnlyPictures(_ page: Int) -> Bool {
    let shown = CTFrameGetVisibleStringRange(frames[page])
    let text = texts[partOfPage[page]].string as NSString
    let words = text.substring(with: NSRange(location: shown.location, length: shown.length))

    return words.contains("\u{FFFC}")
      && words.unicodeScalars.allSatisfy { $0 == "\u{FFFC}" || CharacterSet.whitespacesAndNewlines.contains($0) }
  }

  /// Draws a line of words centred across the page about a height.
  private static func centre(_ words: String, at middle: CGFloat, width: CGFloat, font: UIFont, colour: UIColor) {
    guard !words.isEmpty else {
      return
    }

    let set = NSAttributedString(string: words, attributes: [.font: font, .foregroundColor: colour])
    let measured = set.boundingRect(
      with: CGSize(width: width - 48, height: .greatestFiniteMagnitude),
      options: [.usesLineFragmentOrigin],
      context: nil
    )

    set.draw(
      with: CGRect(
        x: (width - min(measured.width, width - 48)) / 2,
        y: middle - measured.height / 2,
        width: min(measured.width, width - 48) + 1,
        height: measured.height
      ),
      options: [.usesLineFragmentOrigin, .truncatesLastVisibleLine],
      context: nil
    )
  }
}
