const TONE_MAPPING_PROBES = [
  {
    codec: 'hevc',
    config: 'hvc1.2.4.L90.90',
    size: 256,
    description: String.raw`0102200000009000000000005af000fcfdfafa00000f03a00001001840010c01ffff02200000030090000003000003005a959809a10001002d42010102200000030090000003000003005aa008080404d96566924cae6a12201208000003000800000300c840a2000100074401c172b46240`,
    frame: String.raw`000000252801af0a48496580f9cc6f319e13e047873ca281d21ce5d3f693176ba0117087000003036a`,
  },
  {
    codec: 'av1',
    config: 'av01.0.00M.10.0.110.09.16.09.0',
    size: 64,
    description: null,
    frame: String.raw`0a0d00000002afff9b5f2a12201208320b1000c000000280000009ac`,
  },
  {
    codec: 'vp9',
    config: 'vp09.02.10.10.01.09.14.09.00',
    size: 64,
    description: null,
    frame: String.raw`924983425001f801fb001c120e0c2c000018600000673fdc313bb300`,
  },
] as const;

export { TONE_MAPPING_PROBES };
