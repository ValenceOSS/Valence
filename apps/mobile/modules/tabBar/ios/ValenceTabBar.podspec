Pod::Spec.new do |s|
  s.name           = 'ValenceTabBar'
  s.version        = '1.0.0'
  s.summary        = 'The system tab bar, for a phone with liquid glass.'
  s.description    = 'On iOS 26 the tab bar is a floating glass capsule whose selection swells into a lens that can be held and slid between tabs. Only the system bar does that, so this puts the system bar under React Native.'
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
