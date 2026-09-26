Pod::Spec.new do |s|
  s.name           = 'ValencePageCurl'
  s.version        = '1.0.0'
  s.summary        = 'Pages that curl over as a printed book turns them.'
  s.description    = 'UIKit turns pages with a curl that follows the finger from whichever corner it took hold of. This lays that under a reader drawn in React Native.'
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
