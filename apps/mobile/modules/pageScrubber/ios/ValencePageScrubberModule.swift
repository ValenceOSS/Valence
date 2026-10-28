import ExpoModulesCore
import SwiftUI
import UIKit

/// A column or row of a book's pages to scrub through, drawn by SwiftUI on the system's glass.
///
/// Each page works out how far it sits from the middle of the column as it scrolls: the one in the
/// middle is drawn largest and sharpest inside a ring that stays put, and the rest shrink, dim and
/// blur the further off they are, fading out at either end. That is SwiftUI's scroll geometry, which
/// React Native cannot follow frame by frame, so this lays it beside a reader that is otherwise
/// TypeScript's.
///
/// It is handed a small picture of every page and the page showing, springs along whenever that
/// changes, and says which page was left in the middle once a drag or a tap comes to rest, always on
/// a whole page.
public class ValencePageScrubberModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ValencePageScrubber")

    View(PageScrubber.self)
  }
}

/// What React Native hands the column: every page's small picture, the page showing, the colour of
/// the ring, whether the pages run across rather than down, the room it has, measured by React
/// Native since SwiftUI inside it is offered none, and where to say which page was left in the
/// middle, and the page under the ring while a finger is still moving it.
final class PageScrubberProps: ExpoSwiftUI.ViewProps {
  @Field var pictures: [String] = []
  @Field var page: Int = 0
  @Field var ink: Color?
  @Field var isAcross: Bool = false
  @Field var breadth: Double = 0
  @Field var tall: Double = 0
  var onPage = EventDispatcher()
  var onScrubbing = EventDispatcher()
}

/// How much larger the page in the middle is drawn than the rest at their largest.
private let swell: CGFloat = 1.16

/// The room between one page and the next.
private let gap: CGFloat = 8

/// The column or row itself: a glass capsule of pages, the middle one ringed.
struct PageScrubber: ExpoSwiftUI.View {
  @ObservedObject var props: PageScrubberProps

  @State private var centred: Int?
  @State private var isHeld = false

  init(props: PageScrubberProps) {
    self.props = props
  }

  var body: some View {
    GeometryReader { room in
      run(width: room.size.width, height: room.size.height)
    }
    .frame(width: CGFloat(props.breadth), height: CGFloat(props.tall))
    .onAppear {
      centred = props.page
    }
    .onChange(of: centred) { _, to in
      if isHeld, let to {
        props.onScrubbing(["page": to])
      }
    }
    .onChange(of: props.page) { _, to in
      guard !isHeld, centred != to else {
        return
      }

      withAnimation(.spring(response: 0.45, dampingFraction: 0.86)) {
        centred = to
      }
    }
  }

  /// The capsule of pages itself, laid out in the room SwiftUI actually gives it rather than the room
  /// React Native measured, so the pages come to rest under the ring however the two disagree.
  ///
  /// - Parameters:
  ///   - width: How wide the room is.
  ///   - height: How tall the room is.
  /// - Returns: The capsule, its pages and the ring.
  @ViewBuilder
  private func run(width: CGFloat, height: CGFloat) -> some View {
    let isAcross = props.isAcross
    let capsule = max((isAcross ? height : width) - 16, 1)
    let inside = max(capsule - 12, 1)
    let across = isAcross ? (inside / 1.42).rounded() : inside
    let high = isAcross ? inside : (inside * 1.42).rounded()
    let step = (isAcross ? across : high) + gap
    let length = isAcross ? width : height

    ZStack {

      Group {
        if isAcross {
          ScrollView(.horizontal) {
            LazyHStack(spacing: gap) {
              pageRun(across: across, high: high, step: step)
            }
            .scrollTargetLayout()
          }
        } else {
          ScrollView(.vertical) {
            LazyVStack(spacing: gap) {
              pageRun(across: across, high: high, step: step)
            }
            .scrollTargetLayout()
          }
        }
      }
      .scrollIndicators(.hidden)
      .contentMargins(
        isAcross ? .horizontal : .vertical,
        max((length - (isAcross ? across : high)) / 2, 0),
        for: .scrollContent
      )
      .scrollTargetBehavior(.viewAligned)
      .scrollPosition(id: $centred, anchor: .center)
      .onScrollPhaseChange { _, phase in
        isHeld = phase == .interacting || phase == .decelerating

        if phase == .idle, let centred, centred != props.page {
          props.onPage(["page": centred])
        }
      }
      .mask(
        LinearGradient(
          stops: [
            .init(color: .clear, location: 0),
            .init(color: .black, location: 0.14),
            .init(color: .black, location: 0.86),
            .init(color: .clear, location: 1),
          ],
          startPoint: isAcross ? .leading : .top,
          endPoint: isAcross ? .trailing : .bottom
        )
      )
      .background {
        Capsule()
          .fill(.clear)
          .frame(width: isAcross ? nil : capsule, height: isAcross ? capsule : nil)
          .onGlass(in: Capsule())
      }
      .overlay {
        RoundedRectangle(cornerRadius: 14, style: .continuous)
          .strokeBorder((props.ink ?? .white).opacity(0.9), lineWidth: 2.5)
          .frame(width: across * swell + 10, height: high * swell + 10)
          .shadow(color: .black.opacity(0.25), radius: 6, y: 2)
          .allowsHitTesting(false)
      }
    }
  }

  /// Every page's small picture, the one nearest the middle drawn largest and the rest smaller,
  /// dimmer and blurrier the further off they are, each one centred by a tap.
  ///
  /// - Parameters:
  ///   - across: How wide each picture is.
  ///   - high: How tall each picture is.
  ///   - step: How far one page is from the next along the run.
  /// - Returns: The pictures, for whichever stack holds them.
  private func pageRun(across: CGFloat, high: CGFloat, step: CGFloat) -> some View {
    let isAcross = props.isAcross

    return ForEach(props.pictures.indices, id: \.self) { index in
      PagePicture(address: props.pictures[index])
        .frame(width: across, height: high)
        .clipShape(.rect(cornerRadius: 10, style: .continuous))
        .visualEffect { content, proxy in
          let seen = proxy.bounds(of: .scrollView) ?? .zero
          let middle = isAcross ? seen.midX - proxy.size.width / 2 : seen.midY - proxy.size.height / 2
          let away = min(abs(middle) / step, 3)

          return
            content
            .scaleEffect(swell - min(away, 1) * 0.26)
            .blur(radius: max(away - 1.2, 0) * 1.4)
            .opacity(1 - away * 0.12)
        }
        .onTapGesture {
          withAnimation(.spring(response: 0.4, dampingFraction: 0.86)) {
            centred = index
          }
        }
    }
  }
}

/// One page's small picture, fetched as the system fetches any picture by address.
struct PagePicture: View {
  let address: String

  var body: some View {
    AsyncImage(url: URL(string: address)) { phase in
      if let image = phase.image {
        image.resizable().scaledToFill()
      } else {
        Color.white.opacity(0.08)
      }
    }
  }
}

extension View {
  /// Sits the view on the system's liquid glass where the phone has it, and a thin material where
  /// it does not.
  @ViewBuilder
  fileprivate func onGlass<S: Shape>(in shape: S) -> some View {
    if #available(iOS 26.0, *) {
      glassEffect(.regular, in: shape)
    } else {
      background(.ultraThinMaterial, in: shape)
    }
  }
}
