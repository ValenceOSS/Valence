import { compressTheBundle } from './compressTheBundle';

const written = compressTheBundle(process.argv[2] ?? 'web-dist');

process.stdout.write(`Compressed ${(written.length / 2).toString()} files\n`);
