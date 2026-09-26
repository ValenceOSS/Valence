Pod::Spec.new do |s|
  s.name           = 'ValenceSideStrip'
  s.version        = '1.0.0'
  s.summary        = 'Where the system draws its status on the screen.'
  s.description    = 'A folding phone moves the clock and the island into a strip down the side of its screen. Only UIKit knows where, so this asks it.'
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
