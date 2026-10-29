import type { TelemetryReport } from '@ValenceContracts/schemas/TelemetryReport';

type Weighted<Value> = readonly (readonly [Value, number])[];

const VERSIONS: Weighted<string> = [
  ['0.9.0', 30],
  ['0.8.2', 14],
  ['0.8.1', 6],
  ['0.7.4', 4],
  ['0.6.0', 1],
];

const MACHINES: Weighted<
  Pick<TelemetryReport, 'os' | 'cpu' | 'gpus' | 'accels' | 'installMethod'>
> = [
  [
    {
      installMethod: 'docker',
      os: { platform: 'linux', release: '6.8.0-49-generic', arch: 'x64' },
      cpu: { model: 'Intel(R) Core(TM) i5-12400 CPU @ 2.50GHz', cores: 12 },
      gpus: [{ vendor: 'intel', model: 'Intel UHD Graphics 730' }],
      accels: ['vaapi', 'qsv'],
    },
    10,
  ],
  [
    {
      installMethod: 'docker',
      os: { platform: 'linux', release: '6.1.0-26-amd64', arch: 'x64' },
      cpu: { model: 'AMD Ryzen 7 5800X 8-Core Processor', cores: 16 },
      gpus: [{ vendor: 'nvidia', model: 'NVIDIA GeForce RTX 3060' }],
      accels: ['nvenc', 'cuda'],
    },
    7,
  ],
  [
    {
      installMethod: 'docker',
      os: { platform: 'linux', release: '6.6.31+rpt-rpi-v8', arch: 'arm64' },
      cpu: { model: 'Cortex-A76', cores: 4 },
      gpus: [],
      accels: [],
    },
    4,
  ],
  [
    {
      installMethod: 'native',
      os: { platform: 'darwin', release: '25.1.0', arch: 'arm64' },
      cpu: { model: 'Apple M2 Pro', cores: 12 },
      gpus: [{ vendor: 'apple', model: 'Apple M2 Pro' }],
      accels: ['videotoolbox'],
    },
    5,
  ],
  [
    {
      installMethod: 'desktop',
      os: { platform: 'win32', release: '10.0.26100', arch: 'x64' },
      cpu: { model: 'AMD Ryzen 5 7600 6-Core Processor', cores: 12 },
      gpus: [
        { vendor: 'amd', model: 'AMD Radeon(TM) Graphics' },
        { vendor: 'nvidia', model: 'NVIDIA GeForce RTX 4070' },
      ],
      accels: ['d3d11va', 'nvenc', 'amf'],
    },
    4,
  ],
  [
    {
      installMethod: 'docker',
      os: { platform: 'linux', release: '6.8.12-4-pve', arch: 'x64' },
      cpu: { model: 'Intel(R) Xeon(R) CPU E5-2680 v4 @ 2.40GHz', cores: 28 },
      gpus: [],
      accels: [],
    },
    3,
  ],
  [
    {
      installMethod: 'native',
      os: { platform: 'linux', release: '6.11.0-9-generic', arch: 'x64' },
      cpu: { model: 'Intel(R) N100', cores: 4 },
      gpus: [{ vendor: 'intel', model: 'Intel UHD Graphics' }],
      accels: ['vaapi', 'qsv'],
    },
    6,
  ],
  [
    {
      installMethod: 'other',
      os: { platform: 'freebsd', release: '14.1-RELEASE', arch: 'x64' },
      cpu: { model: 'AMD EPYC 7302P 16-Core Processor', cores: 32 },
      gpus: [],
      accels: [],
    },
    1,
  ],
];

const MEMORY: Weighted<TelemetryReport['memoryGb']> = [
  ['<4', 2],
  ['4-8', 5],
  ['8-16', 9],
  ['16-32', 10],
  ['32-64', 6],
  ['64-128', 2],
  ['128+', 1],
];

const DATABASES: Weighted<TelemetryReport['database']> = [
  ['postgres', 14],
  ['mysql', 3],
  ['mariadb', 4],
];

const FEW: Weighted<TelemetryReport['library']['films']> = [
  ['0', 3],
  ['1-9', 2],
  ['10-99', 5],
  ['100-999', 8],
  ['1000-9999', 4],
  ['10000+', 1],
];

const MANY: Weighted<TelemetryReport['library']['films']> = [
  ['0', 4],
  ['1-9', 1],
  ['10-99', 2],
  ['100-999', 6],
  ['1000-9999', 8],
  ['10000+', 3],
];

const CLIENTS: Weighted<TelemetryReport['library']['films']> = [
  ['0', 4],
  ['1-9', 6],
  ['10-99', 2],
];

/**
 * Picks one of several values, each as likely as its weight says.
 *
 * @param from - The values and their weights.
 * @param random - Where the chance comes from.
 * @returns The value picked.
 */
const pick = <Value>(from: Weighted<Value>, random: () => number): Value => {
  const whole = from.reduce((sum, [, weight]) => sum + weight, 0);
  let left = random() * whole;

  for (const [value, weight] of from) {
    left -= weight;

    if (left < 0) {
      return value;
    }
  }

  const [last] = from.at(-1) ?? [];

  if (last === undefined) {
    throw new Error('There is nothing to pick from.');
  }

  return last;
};

/**
 * Makes up a plausible report from one fake install, for seeing the page with something on it.
 *
 * @param installId - The fake install's id.
 * @param random - Where the chance comes from.
 * @returns The report.
 */
const fakeReportOf = (installId: string, random: () => number): TelemetryReport => {
  const machine = pick(MACHINES, random);

  return {
    schemaVersion: 1,
    installId,
    version: pick(VERSIONS, random),
    ...machine,
    memoryGb: pick(MEMORY, random),
    database: pick(DATABASES, random),
    library: {
      films: pick(FEW, random),
      episodes: pick(MANY, random),
      tracks: pick(MANY, random),
      books: pick(FEW, random),
    },
    clients: {
      browser: pick(CLIENTS, random),
      tv: pick(CLIENTS, random),
      phone: pick(CLIENTS, random),
      desktop: pick(CLIENTS, random),
    },
  };
};

export { fakeReportOf };
