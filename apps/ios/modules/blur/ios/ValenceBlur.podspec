Pod::Spec.new do |s|
  s.name           = 'ValenceBlur'
  s.version        = '1.0.0'
  s.summary        = 'An even blur over whatever is behind it.'
  s.description    = 'The system blur, over the whole of what is behind it, for a picture that should be felt rather than seen.'
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
