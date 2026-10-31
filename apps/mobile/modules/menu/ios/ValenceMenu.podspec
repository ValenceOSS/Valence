Pod::Spec.new do |s|
  s.name           = 'ValenceMenu'
  s.version        = '1.0.0'
  s.summary        = 'The system menu, dropped from a control React Native draws.'
  s.description    = 'Opens the system menu from an unseen button over a control drawn in React Native, and says when it opens, when it closes and what was picked.'
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
