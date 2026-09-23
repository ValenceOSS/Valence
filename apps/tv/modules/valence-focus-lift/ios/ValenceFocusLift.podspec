Pod::Spec.new do |s|
  s.name           = 'ValenceFocusLift'
  s.version        = '0.0.0'
  s.summary        = 'Lifts whatever the remote lands on, in step with the television’s own focus animation.'
  s.author         = 'Valence'
  s.homepage       = 'https://getvalence.app'
  s.license        = 'MIT'
  s.platforms      = { :tvos => '16.4', :ios => '16.4' }
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.swift'
end
