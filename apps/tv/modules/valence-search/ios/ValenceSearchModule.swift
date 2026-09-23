import ExpoModulesCore

/// The television's own search screen, offered to JavaScript as a view to put Valence's results in.
public class ValenceSearchModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ValenceSearch")

    View(ValenceSearchView.self) {
      Events("onChangeText", "onResultsLayout")

      Prop("placeholder") { (view: ValenceSearchView, placeholder: String) in
        view.placeholder = placeholder
      }

      Prop("upTo") { (view: ValenceSearchView, tag: Int?) in
        view.upToTag = tag
      }
    }
  }
}
