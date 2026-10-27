import { describe, expect, it } from 'vitest';
import { FilesAnswerSchema } from './FilesAnswerSchema';

const aFile = (name: string) => ({
  name,
  sizeBytes: 10,
  url: `https://eu1.files.example.com/f/${encodeURIComponent(name)}`,
});

describe('FilesAnswerSchema', () => {
  it('reads the files of a finished download', () => {
    expect(FilesAnswerSchema.parse({ files: [aFile('a.mkv'), aFile('b.srt')] })).toEqual({
      files: [aFile('a.mkv'), aFile('b.srt')],
    });
  });

  it('refuses a file named twice', () => {
    expect(FilesAnswerSchema.safeParse({ files: [aFile('a.mkv'), aFile('a.mkv')] }).success).toBe(
      false,
    );
  });

  it('reads why a download client would not hand over the files', () => {
    expect(FilesAnswerSchema.parse({ refused: { reason: 'notReady' } })).toEqual({
      refused: { reason: 'notReady', message: null },
    });
  });
});
