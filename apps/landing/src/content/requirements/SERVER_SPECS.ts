const SERVER_SPECS = [
  {
    resource: 'Processor',
    least: '64-bit x86, 2 cores',
    comfortable: '4 or more cores',
    note: 'Software transcoding is the heaviest thing Valence does. Direct play needs almost none.',
  },
  {
    resource: 'Memory',
    least: '2 GB free for the stack',
    comfortable: '4 GB or more',
    note: 'The database, the server and FFmpeg share it. Requesting adds about 150 MB, and about 700 MB while it gets past Cloudflare.',
  },
  {
    resource: 'Graphics',
    least: 'None',
    comfortable: 'Intel, AMD or NVIDIA that FFmpeg can use',
    note: 'Optional. Without it every transcode runs on the processor.',
  },
  {
    resource: 'Storage',
    least: 'A local disk for the database, settings and cache',
    comfortable: 'An SSD for the database and transcodes',
    note: 'The library itself can be on network storage, mounted read-only.',
  },
] as const;

export { SERVER_SPECS };
