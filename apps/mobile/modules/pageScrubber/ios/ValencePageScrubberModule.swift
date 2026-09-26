import ExpoModulesCore
import SwiftUI
import UIKit

/// A column of a book's pages to scrub through, drawn by SwiftUI on the system's glass.
///
/// Each page works out how far it sits from the middle of the column as it scrolls: the one in the
/// middle is drawn largest and sharpest inside a ring that stays put, and the rest shrink, dim and
/// blur the further off they are, fading out at either end. That is SwiftUI's scroll geometry, which
/// React Native cannot follow frame by frame, so this lays it beside a reader that is otherwise
/// TypeScript's.
///
/// It is handed a small picture of every page and the page showing, springs along whenever that
/// changes, and says which page was left in the middle once a drag or a tap comes to rest.
public class ValencePageScrubberModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ValencePageScrubber")

    View(PageScrubber.self)
  }
}

/// What React Native hands the column: every page's small picture, the page showing, the colour of
/// the ring, the room it has, measured by React Native since SwiftUI inside it is offered none, and
/// where to say which page was left in the middle.
final class PageScrubberProps: ExpoSwiftUI.ViewProps {
  @Field var pictures: [String] = []
  @Field var page: Int = 0
  @Field var ink: Color?
  @Field var breadth: Double = 0
  @Field var tall: Double = 0
  var onPage = EventDispatcher()
}

/// How much larger the page in the middle is drawn than the rest at their largest.
private let swell: CGFloat = 1.16

/// The room between one page and the next.
private let gap: CGFloat = 8

/// The column itself: a glass capsule of pages, the middle one ringed.
struct PageScrubber: ExpoSwiftUI.View {
  @ObservedObject var props: PageScrubberProps

  @State private var centred: Int?
  @State private var isHeld = false

  init(props: PageScrubberProps) {
    self.props = props
  }

  var body: some View {
    let width = CGFloat(props.breadth)
    let height = CGFloat(props.tall)
    let capsule = max(width - 16, 1)
    let across = max(capsule - 12, 1)
    let high = (across * 1.42).rounded()
    let step = high + gap

    ZStack {

      ScrollView(.vertical) {
        LazyVStack(spacing: gap) {
          ForEach(props.pictures.indices, id: \.self) { index in
            PagePicture(address: props.pictures[index])
              .frame(width: across, height: high)
              .clipShape(.rect(cornerRadius: 10, style: .continuous))
              .visualEffect { content, proxy in
                let seen = proxy.bounds(of: .scrollView) ?? .zero
                let away = min(abs(seen.midY - proxy.size.height / 2) / step, 3)

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
        .scrollTargetLayout()
      }
      .scrollIndicators(.hidden)
      .contentMargins(.vertical, max((height - high) / 2, 0), for: .scrollContent)
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
          startPoint: .top,
          endPoint: .bottom
        )
      )
      .background {
        Capsule()
          .fill(.clear)
          .frame(width: capsule)
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
    .frame(width: width, height: height)
    .onAppear {
      centred = props.page
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
