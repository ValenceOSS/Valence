import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import type { FeedFile } from '@ValenceDesktop/build/FeedFile';
import { anElectronFeed } from '@ValenceDesktop/build/anElectronFeed';
import { electronFeedOf } from '@ValenceDesktop/build/electronFeedOf';

const { values } = parseArgs({
  options: {
    folder: { type: 'string', default: 'release' },
    version: { type: 'string' },
    dev: { type: 'boolean', default: false },
    out: { type: 'string' },
  },
});

const version = values.version?.replace(/^v/u, '');
const channel = values.dev ? 'dev' : 'latest';
const out = values.out ?? values.folder;
const feeds = new Map<string, FeedFile[]>();

for (const file of readdirSync(values.folder).toSorted()) {
  const feed = electronFeedOf(file, channel);

  if (feed !== undefined) {
    const path = join(values.folder, file);
    const offered = {
      url: file,
      sha512: createHash('sha512').update(readFileSync(path)).digest('base64'),
      size: statSync(path).size,
    };

    feeds.set(feed, [...(feeds.get(feed) ?? []), offered]);
  }
}

if (version === undefined || version === '') {
  process.stderr.write(
    'Usage: writeElectronFeeds --version <version> [--dev] [--folder <folder>] [--out <folder>]\n',
  );
  process.exitCode = 1;
} else if (feeds.size === 0) {
  process.stderr.write(`There is nothing in ${values.folder} the Electron app could update to.\n`);
  process.exitCode = 1;
} else {
  const releasedAt = new Date();

  for (const [feed, files] of feeds) {
    writeFileSync(join(out, feed), anElectronFeed(version, files, releasedAt));
  }

  process.stdout.write(`Wrote ${[...feeds.keys()].join(', ')} in ${out}\n`);
}
