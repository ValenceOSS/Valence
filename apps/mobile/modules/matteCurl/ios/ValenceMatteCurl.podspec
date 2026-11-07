Pod::Spec.new do |s|
  s.name           = 'ValenceMatteCurl'
  s.version        = '1.0.0'
  s.summary        = 'Pages that bend over as paper does, drawn matte.'
  s.description    = 'A page turned by bending it round a cylinder that follows the finger, shaded with a soft shadow and no sheen, for reading text on dark pages as well as light.'
  s.author         = 'Valence'
  s.homepage       = 'https://getvalence.app'
  s.license        = { :type => 'MIT' }
  s.platforms      = { :ios => '18.0' }
  s.source         = { :git => '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule',
    'SWIFT_OPTIMIZATION_LEVEL' => '-O'
  }

  s.source_files = '**/*.{h,m,mm,swift,hpp,cpp}'
end
