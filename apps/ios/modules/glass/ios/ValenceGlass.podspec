Pod::Spec.new do |s|
  s.name           = 'ValenceGlass'
  s.version        = '1.0.0'
  s.summary        = 'The system glass, for controls on a phone that has it.'
  s.description    = 'iOS 26 draws its controls on liquid glass, which only UIKit makes. This lays it behind a control drawn in React Native.'
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
