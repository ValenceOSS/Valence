import { crc32 } from 'node:zlib';

const LOCAL = 0x04_03_4b_50;

const CENTRAL = 0x02_01_4b_50;

const END = 0x06_05_4b_50;

/**
 * A zip holding the given files, stored rather than compressed, for a test that needs one on disk.
 *
 * @param files - Each file's name in the zip and what it holds.
 * @returns The zip's bytes.
 */
const aStoredZip = (files: Readonly<Record<string, string>>): Buffer => {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;

  for (const [name, text] of Object.entries(files)) {
    const named = Buffer.from(name, 'utf8');
    const data = Buffer.from(text, 'utf8');
    const crc = crc32(data);
    const local = Buffer.alloc(30);

    local.writeUInt32LE(LOCAL, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(named.length, 26);

    const central = Buffer.alloc(46);

    central.writeUInt32LE(CENTRAL, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(named.length, 28);
    central.writeUInt32LE(offset, 42);

    locals.push(local, named, data);
    centrals.push(central, named);
    offset += local.length + named.length + data.length;
  }

  const directory = Buffer.concat(centrals);
  const end = Buffer.alloc(22);

  end.writeUInt32LE(END, 0);
  end.writeUInt16LE(Object.keys(files).length, 8);
  end.writeUInt16LE(Object.keys(files).length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);

  return Buffer.concat([...locals, directory, end]);
};

export { aStoredZip };
