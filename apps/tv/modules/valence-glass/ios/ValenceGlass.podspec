Pod::Spec.new do |s|
  s.name           = 'ValenceGlass'
  s.version        = '0.0.0'
  s.summary        = 'Draws Liquid Glass behind what it holds, or a frosted blur where the system has none.'
  s.author         = 'Valence'
  s.homepage       = 'https://getvalence.app'
  s.license        = 'MIT'
  s.platforms      = { :tvos => '16.4', :ios => '16.4' }
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.swift'
end
