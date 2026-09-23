Pod::Spec.new do |s|
  s.name           = 'ValenceLights'
  s.version        = '1.0.0'
  s.summary        = 'Reads the colours of a picture, for the lights behind a page.'
  s.description    = 'The web lights its pages with the colours of the artwork on them, read from a canvas. A phone has no canvas, so the same reading is done here.'
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
