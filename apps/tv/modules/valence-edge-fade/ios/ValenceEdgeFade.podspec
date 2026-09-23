Pod::Spec.new do |s|
  s.name           = 'ValenceEdgeFade'
  s.version        = '0.0.0'
  s.summary        = 'Fades what it holds out to nothing towards one edge.'
  s.author         = 'Valence'
  s.homepage       = 'https://getvalence.app'
  s.license        = 'MIT'
  s.platforms      = { :tvos => '16.4', :ios => '16.4' }
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.swift'
end
