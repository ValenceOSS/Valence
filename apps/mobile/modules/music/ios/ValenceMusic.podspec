Pod::Spec.new do |s|
  s.name           = 'ValenceMusic'
  s.version        = '1.0.0'
  s.summary        = 'Plays Valence music in the background, with the lock screen and Control Centre.'
  s.description    = 'Music keeps playing with the phone locked and the app closed, and is controlled from the lock screen, Control Centre and headphones, as music on an iPhone is.'
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
