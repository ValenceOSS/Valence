Pod::Spec.new do |s|
  s.name           = 'ValenceFocusFence'
  s.version        = '0.0.0'
  s.summary        = 'Keeps the remote out of whatever it holds while it is shut.'
  s.author         = 'Valence'
  s.homepage       = 'https://getvalence.app'
  s.license        = 'MIT'
  s.platforms      = { :tvos => '16.4', :ios => '16.4' }
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.swift'
end
