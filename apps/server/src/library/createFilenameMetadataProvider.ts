import { parseName } from './naming/parseName';
import { nameOfFile } from './nameOfFile';
import type { MetadataProvider } from './MetadataProvider';

/**
 * The provider Valence ships with, which names a file from what the scan read out of its path — its
 * title and year — and nothing else. Always available and never wrong about anything it has not
 * claimed, which is what makes it the layer everything else is chosen against.
 */
const createFilenameMetadataProvider = (): MetadataProvider => ({
  name: 'filename',
  describe: (facts) => {
    const read = parseName(facts.title ?? nameOfFile(facts.path));

    return Promise.resolve({
      title: facts.title ?? read.name,
      year: facts.year !== undefined ? facts.year : read.year,
    });
  },
});

export { createFilenameMetadataProvider };
