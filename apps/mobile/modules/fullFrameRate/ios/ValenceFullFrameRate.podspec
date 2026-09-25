Pod::Spec.new do |s|
  s.name           = 'ValenceFullFrameRate'
  s.version        = '1.0.0'
  s.summary        = 'Animations at the full frame rate of a ProMotion screen.'
  s.description    = 'Has the frame clocks React Native animates by ask for 120 Hz, which its precompiled core never does.'
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
