Pod::Spec.new do |s|
  s.name           = 'ValenceWebSignIn'
  s.version        = '1.0.0'
  s.summary        = 'Signs somebody in on the Valence web page and brings the answer back to the app.'
  s.description    = 'A passkey is tied to a website, and an app can only use one for a website that vouches for it, which a server at an address of its own choosing cannot do. The system browser sheet can, and this opens it.'
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
