Pod::Spec.new do |s|
  s.name           = 'ValenceDiscovery'
  s.version        = '0.0.0'
  s.summary        = 'Hears the Valence servers announced on the local network.'
  s.author         = 'Valence'
  s.homepage       = 'https://getvalence.app'
  s.license        = 'MIT'
  s.platforms      = { :tvos => '16.4', :ios => '16.4' }
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.swift'
end
