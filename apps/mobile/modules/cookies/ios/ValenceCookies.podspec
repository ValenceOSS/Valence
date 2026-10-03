Pod::Spec.new do |s|
  s.name           = 'ValenceCookies'
  s.version        = '1.0.0'
  s.summary        = 'Reads the cookies the phone holds for a server.'
  s.description    = 'What the system sends a server is kept in its own cookie jar, which the player, the socket and uploads are not told to consult. This reads it for them.'
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
