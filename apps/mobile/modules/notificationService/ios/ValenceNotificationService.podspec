Pod::Spec.new do |s|
  s.name           = 'ValenceNotificationService'
  s.version        = '1.0.0'
  s.summary        = 'Shares the sign-in with the notification service extension.'
  s.description    = 'A push carries no words, so the extension reads them from the server the phone is signed in to. This hands it the server and the session, through a keychain group the app and the extension share.'
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

  s.source_files = 'module/**/*.swift', 'shared/**/*.swift'
end
