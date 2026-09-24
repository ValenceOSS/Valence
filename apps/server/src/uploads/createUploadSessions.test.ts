import { describe, expect, it } from 'vitest';
import { createUploadSessions } from './createUploadSessions';

const UPLOAD = {
  libraryId: 'films',
  path: 'Arrival.mkv',
  destination: '/media/films/Arrival.mkv',
  bytes: 25,
};

describe('createUploadSessions', () => {
  it('counts the pieces, and stages the file hidden beside where it goes', () => {
    const session = createUploadSessions(Date.now, 100, 10).open(UPLOAD);

    expect(session.pieces).toBe(3);
    expect(session.staging).toBe(`/media/films/.Arrival.mkv.${session.uploadId}.part`);
  });

  it('counts an empty file as one piece', () => {
    expect(createUploadSessions(Date.now, 100, 10).open({ ...UPLOAD, bytes: 0 }).pieces).toBe(1);
  });

  it('finds an upload only through the library it is for', () => {
    const sessions = createUploadSessions();
    const session = sessions.open(UPLOAD);

    expect(sessions.find(session.uploadId, 'films')).toBe(session);
    expect(sessions.find(session.uploadId, 'shows')).toBeNull();
  });

  it('forgets an upload once it is closed', () => {
    const sessions = createUploadSessions();
    const session = sessions.open(UPLOAD);

    sessions.close(session.uploadId);

    expect(sessions.find(session.uploadId, 'films')).toBeNull();
  });

  it('gives up the uploads left alone too long, and keeps those still being sent', () => {
    let time = 0;
    const sessions = createUploadSessions(() => time, 100, 10);
    const left = sessions.open(UPLOAD);
    const kept = sessions.open(UPLOAD);

    time = 90;
    sessions.find(kept.uploadId, 'films');
    time = 150;

    expect(sessions.stale()).toEqual([left]);
    expect(sessions.find(left.uploadId, 'films')).toBeNull();
    expect(sessions.find(kept.uploadId, 'films')).toBe(kept);
  });
});
