Pod::Spec.new do |s|
  s.name           = 'ValenceTopShelf'
  s.version        = '0.0.0'
  s.summary        = 'Keeps the titles the television shows above Valence in its top row.'
  s.author         = 'Valence'
  s.homepage       = 'https://getvalence.app'
  s.license        = 'MIT'
  s.platforms      = { :tvos => '16.4', :ios => '16.4' }
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.swift'
end
