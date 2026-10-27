import { describe, expect, it } from 'vitest';
import { RemoteFileSchema } from './RemoteFileSchema';

const aFile = (name: string, url = 'https://eu1.files.example.com/f/abc') => ({
  name,
  sizeBytes: 1024,
  url,
});

describe('RemoteFileSchema', () => {
  it('reads a file inside a folder of the download', () => {
    expect(RemoteFileSchema.safeParse(aFile('Film (2001)/film.mkv')).success).toBe(true);
  });

  it.each(['/etc/passwd', '../film.mkv', 'a/../../film.mkv', 'a//b.mkv', 'a\\b.mkv', './a.mkv'])(
    'refuses a name that could leave the download: %s',
    (name) => {
      expect(RemoteFileSchema.safeParse(aFile(name)).success).toBe(false);
    },
  );

  it('refuses a link that is not https', () => {
    expect(RemoteFileSchema.safeParse(aFile('a.mkv', 'http://files.example.com/a')).success).toBe(
      false,
    );
  });
});
