Pod::Spec.new do |s|
  s.name           = 'ValenceFadedEdges'
  s.version        = '1.0.0'
  s.summary        = 'A view whose contents fade out at its edges.'
  s.description    = 'A row that scrolls sideways fades out where it runs under what sits beside it. Only a gradient mask does that, and React Native has none.'
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
