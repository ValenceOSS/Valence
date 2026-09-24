import { describe, expect, it } from 'vitest';
import { beginUploadSession } from './beginUploadSession';

const UPLOAD = {
  libraryId: 'films',
  path: 'Arrival.mkv',
  destination: '/media/films/Arrival.mkv',
  bytes: 25,
};

describe('beginUploadSession', () => {
  it('counts the pieces, and stages the file hidden beside where it goes', () => {
    const session = beginUploadSession(UPLOAD, 10, 5);

    expect(session).toMatchObject({ pieces: 3, pieceBytes: 10, received: [], touchedAt: 5 });
    expect(session.staging).toBe(`/media/films/.Arrival.mkv.${session.uploadId}.part`);
  });

  it('counts an empty file as one piece', () => {
    expect(beginUploadSession({ ...UPLOAD, bytes: 0 }, 10, 0).pieces).toBe(1);
  });
});
