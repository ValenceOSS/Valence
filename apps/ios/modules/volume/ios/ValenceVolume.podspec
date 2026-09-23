Pod::Spec.new do |s|
  s.name           = 'ValenceVolume'
  s.version        = '1.0.0'
  s.summary        = 'The system volume slider, for the music player.'
  s.description    = 'Wraps MPVolumeView, which moves with the buttons on the side of the phone and sets the volume of whatever AirPlay speaker is playing.'
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
