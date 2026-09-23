Pod::Spec.new do |s|
  s.name           = 'ValenceSoftFocus'
  s.version        = '1.0.0'
  s.summary        = 'Blurs what is inside it, for words out of focus.'
  s.description    = 'Draws its contents once and blurs the picture, since iOS has no public way to blur a view by itself.'
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
