Pod::Spec.new do |s|
  s.name           = 'ValenceNearby'
  s.version        = '1.0.0'
  s.summary        = 'Finds the Valence servers announcing themselves on the local network.'
  s.description    = 'A Valence server announces itself over Bonjour, as the desktop app finds it. This browses for that announcement and works out where each one answers.'
  s.author         = 'Valence'
  s.homepage       = 'https://getvalence.app'
  s.license        = { :type => 'MIT' }
  s.platforms      = { :ios => '18.0' }
  s.source         = { :git => '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = '**/*.{h,m,mm,swift,hpp,cpp}'
end
