Pod::Spec.new do |s|
  s.name           = 'ValenceSegmentedControl'
  s.version        = '1.0.0'
  s.summary        = 'The segmented control iOS draws, for a choice of a few.'
  s.description    = 'A choice of a few drawn as iOS draws one everywhere else: UISegmentedControl, on liquid glass where the phone has it.'
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
