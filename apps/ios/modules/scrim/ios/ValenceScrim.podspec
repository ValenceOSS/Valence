Pod::Spec.new do |s|
  s.name           = 'ValenceScrim'
  s.version        = '1.0.0'
  s.summary        = 'The darkening and blur that let words sit on artwork.'
  s.description    = 'The web darkens artwork under its words with a gradient and blurs it towards the foot. React Native draws neither, and a blur that fades in needs a masked native view.'
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
