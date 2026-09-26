Pod::Spec.new do |s|
  s.name           = 'ValencePageScrubber'
  s.version        = '1.0.0'
  s.summary        = 'A column of pages to scrub through, as the system draws one.'
  s.description    = 'SwiftUI scales, blurs and rings each page as it passes the middle of a scrolling column, which React Native cannot. This lays that beside a reader drawn in React Native.'
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
