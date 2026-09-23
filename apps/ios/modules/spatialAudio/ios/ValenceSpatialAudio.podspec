Pod::Spec.new do |s|
  s.name           = 'ValenceSpatialAudio'
  s.version        = '1.0.0'
  s.summary        = 'Lets iOS place a two channel soundtrack around somebody, not only six.'
  s.description    = 'An AVPlayerItem is only spatialised if it says it may be, and what it says by default is multichannel alone. Nothing in expo-video sets or exposes that.'
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
