Pod::Spec.new do |s|
  s.name           = 'ValenceCarPlay'
  s.version        = '1.0.0'
  s.summary        = 'Valence music in CarPlay.'
  s.description    = 'Draws Valence music in a car with the templates CarPlay provides: a tab bar of lists, and the system Now Playing screen.'
  s.author         = 'Valence'
  s.homepage       = 'https://getvalence.app'
  s.license        = { :type => 'MIT' }
  s.platforms      = { :ios => '18.0' }
  s.source         = { :git => '' }
  s.static_framework = true
  s.frameworks     = 'CarPlay'

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = '*.swift'
end
