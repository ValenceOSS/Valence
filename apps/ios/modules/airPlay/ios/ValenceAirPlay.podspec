Pod::Spec.new do |s|
  s.name           = 'ValenceAirPlay'
  s.version        = '1.0.0'
  s.summary        = 'The system AirPlay picker.'
  s.description    = 'Choosing where a phone plays to is a system control, AVRoutePickerView, which React Native does not have.'
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
