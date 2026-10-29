const LABELS = {
  platform: {
    linux: 'Linux',
    darwin: 'macOS',
    win32: 'Windows',
    freebsd: 'FreeBSD',
  },
  arch: {
    x64: 'x86-64',
    arm64: 'ARM64',
    arm: 'ARM, 32-bit',
  },
  installMethod: {
    docker: 'Docker',
    native: 'Installed directly',
    desktop: 'Desktop app',
  },
  database: {
    postgres: 'PostgreSQL',
    mysql: 'MySQL',
    mariadb: 'MariaDB',
  },
  cpuVendor: {
    amd: 'AMD',
    intel: 'Intel',
    apple: 'Apple',
    arm: 'Other ARM',
  },
  cores: {
    '1-2': '1 or 2 cores',
    '3-4': '3 or 4 cores',
    '5-8': '5 to 8 cores',
    '9-16': '9 to 16 cores',
    '17-32': '17 to 32 cores',
    '33-64': '33 to 64 cores',
    '65+': '65 cores or more',
  },
  memory: {
    '<4': 'Under 4 GB',
    '4-8': '4 to 8 GB',
    '8-16': '8 to 16 GB',
    '16-32': '16 to 32 GB',
    '32-64': '32 to 64 GB',
    '64-128': '64 to 128 GB',
    '128+': '128 GB or more',
  },
  gpuVendor: {
    nvidia: 'NVIDIA',
    amd: 'AMD',
    intel: 'Intel',
    apple: 'Apple',
    qualcomm: 'Qualcomm',
    none: 'No graphics found',
  },
  accel: {
    none: 'None, software only',
    vaapi: 'VA-API',
    nvenc: 'NVENC',
    cuda: 'CUDA',
    qsv: 'Intel Quick Sync',
    videotoolbox: 'VideoToolbox',
    d3d11va: 'Direct3D 11',
    d3d12va: 'Direct3D 12',
    dxva2: 'DXVA2',
    amf: 'AMD AMF',
    vulkan: 'Vulkan',
    v4l2m2m: 'V4L2',
    rkmpp: 'Rockchip MPP',
    opencl: 'OpenCL',
  },
  client: {
    browser: 'A web browser',
    desktop: 'The desktop app',
    tv: 'A television',
    phone: 'A phone',
  },
  count: {
    '0': 'None',
    '1-9': '1 to 9',
    '10-99': '10 to 99',
    '100-999': '100 to 999',
    '1000-9999': '1,000 to 9,999',
    '10000+': '10,000 or more',
  },
} as const satisfies Record<string, Record<string, string>>;

type LabelKind = keyof typeof LABELS;

const NAMES: Readonly<Record<LabelKind, Readonly<Record<string, string>>>> = LABELS;

/**
 * Names a group the way the page shows it, such as "macOS" for `darwin`.
 *
 * @param kind - What sort of group it is.
 * @param id - The group, as a report gives it.
 * @returns Its name, or the id itself where it has none of its own.
 */
const labelOf = (kind: LabelKind, id: string): string =>
  id === 'other' ? 'Other' : (NAMES[kind][id] ?? id);

export type { LabelKind };

export { labelOf };
