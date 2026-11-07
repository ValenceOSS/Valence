import CoreText
import UIKit

/// A run of a paragraph's words in one style.
struct TypesetRun: Decodable {
  let text: String
  let isItalic: Bool
  let isBold: Bool
}

/// One block of a chapter: a paragraph, a heading, a quotation or a break, with the places within it
/// that the book's contents and links name.
struct TypesetBlock: Decodable {
  let kind: String
  let runs: [TypesetRun]
  let anchors: [String]
}

/// How a chapter is set: the type, how far apart its lines are, the room round it, the colours, and
/// the words above and below every page.
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
  let heading: String
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
    self.heading = given["heading"] as? String ?? ""
    self.footer = given["footer"] as? String ?? ""
    self.isJustified = given["isJustified"] as? Bool ?? true
  }
}

/// A chapter laid out in pages, as Apple Books lays out a book: set with Core Text into a column
/// exactly a whole number of lines tall, so every page breaks between two lines, and each page drawn
/// as a picture on demand. Made and drawn away from the main thread; nothing in it changes once
/// made, so it can be read from any thread.
final class TypesetBook {
  let frames: [CTFrame]
  let anchors: [String: Int]
  let look: TypesetLook
  let size: CGSize
  let scale: CGFloat

  /// Lays a chapter out in pages of a given size.
  init(blocks: [TypesetBlock], look: TypesetLook, size: CGSize, scale: CGFloat) {
    self.look = look
    self.size = size
    self.scale = scale

    let text = NSMutableAttributedString()
    var anchoredAt: [String: Int] = [:]

    for block in blocks {
      let starts = text.length

      for name in block.anchors {
        anchoredAt[name] = starts
      }

      text.append(Self.set(block, look: look))
    }

    let column = CGSize(
      width: max(size.width - look.insetX * 2, 1),
      height: max(floor((size.height - look.top - look.foot) / look.lineHeight) * look.lineHeight, look.lineHeight)
    )
    let framesetter = CTFramesetterCreateWithAttributedString(text)
    let path = CGPath(rect: CGRect(origin: .zero, size: column), transform: nil)
    var made: [CTFrame] = []
    var from = 0

    while from < text.length {
      let frame = CTFramesetterCreateFrame(framesetter, CFRange(location: from, length: 0), path, nil)
      let shown = CTFrameGetVisibleStringRange(frame)

      made.append(frame)
      from += max(shown.length, 1)
    }

    if made.isEmpty {
      made.append(CTFramesetterCreateFrame(framesetter, CFRange(location: 0, length: 0), path, nil))
    }

    frames = made
    anchors = anchoredAt.mapValues { at in
      made.firstIndex { frame in
        let shown = CTFrameGetVisibleStringRange(frame)

        return at < shown.location + shown.length
      } ?? 0
    }
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

  /// Draws one page: the paper, the chapter's name above, the page's lines, and where it is in the
  /// chapter below.
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

      Self.centre(look.heading, at: look.headerCentre, width: size.width, font: chromeFont, colour: quiet)
      Self.centre(
        look.footer
          .replacingOccurrences(of: "{value}", with: String(page + 1))
          .replacingOccurrences(of: "{count}", with: String(frames.count)),
        at: look.footerCentre,
        width: size.width,
        font: chromeFont,
        colour: quiet
      )

      let column = CTFrameGetPath(frames[page]).boundingBox

      context.saveGState()
      context.textMatrix = .identity
      context.translateBy(x: look.insetX, y: look.top + column.height)
      context.scaleBy(x: 1, y: -1)
      CTFrameDraw(frames[page], context)
      context.restoreGState()
    }
    .preparingForDisplay()
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
