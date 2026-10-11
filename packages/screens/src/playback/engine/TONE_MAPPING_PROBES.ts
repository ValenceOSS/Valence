const TONE_MAPPING_PROBES = [
  {
    codec: 'hevc',
    config: 'hev1.2.4.L30.90',
    description: String.raw`0102200000009000000000001ef000fcfdfafa00000f03a00001001840010c01ffff02200000030090000003000003001e959409a10001002d42010102200000030090000003000003001ea0208104d965654a4c2f016a12201208000003000800000300c040a2000100064401c073c089`,
    frame: String.raw`000000092801ac760d9091d238`,
  },
  {
    codec: 'av1',
    config: 'av01.0.00M.10.0.110.09.16.09.0',
    description: null,
    frame: String.raw`0a0d00000002afff9b5f2a12201208320b1000c000000280000009ac`,
  },
  {
    codec: 'vp9',
    config: 'vp09.02.10.10.01.09.14.09.00',
    description: null,
    frame: String.raw`924983425001f801fb001c120e0c2c000018600000673fdc313bb300`,
  },
] as const;

export { TONE_MAPPING_PROBES };
