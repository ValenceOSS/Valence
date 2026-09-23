Pod::Spec.new do |s|
  s.name           = 'ValenceCodeScanner'
  s.version        = '1.0.0'
  s.summary        = 'Reads a QR code with the camera, in the system scanner.'
  s.description    = 'A television signing in shows a QR code carrying the code to approve it with. This opens VisionKit\'s own scanner over the app and hands back what the first code it finds says.'
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
