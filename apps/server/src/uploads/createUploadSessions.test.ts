import { describe, expect, it } from 'vitest';
import { createUploadSessions } from './createUploadSessions';

const UPLOAD = {
  libraryId: 'films',
  path: 'Arrival.mkv',
  destination: '/media/films/Arrival.mkv',
  bytes: 25,
};

describe('createUploadSessions', () => {
  it('finds an upload only through the library it is for', async () => {
    const sessions = createUploadSessions(Date.now, 100, 10);
    const session = await sessions.open(UPLOAD);

    expect((await sessions.find(session.uploadId, 'films'))?.uploadId).toBe(session.uploadId);
    await expect(sessions.find(session.uploadId, 'shows')).resolves.toBeNull();
  });

  it('keeps the pieces that arrived whole, each once, in order, and drops one that did not', async () => {
    const sessions = createUploadSessions(Date.now, 100, 10);
    const { uploadId } = await sessions.open(UPLOAD);

    await sessions.receive(uploadId, 2, true);
    await sessions.receive(uploadId, 0, true);
    await expect(sessions.receive(uploadId, 2, true)).resolves.toEqual([0, 2]);
    await expect(sessions.receive(uploadId, 0, false)).resolves.toEqual([2]);
    expect((await sessions.find(uploadId, 'films'))?.received).toEqual([2]);
  });

  it('forgets an upload once it is closed', async () => {
    const sessions = createUploadSessions(Date.now, 100, 10);
    const { uploadId } = await sessions.open(UPLOAD);

    await sessions.close(uploadId);

    await expect(sessions.find(uploadId, 'films')).resolves.toBeNull();
    await expect(sessions.receive(uploadId, 0, true)).resolves.toEqual([]);
  });

  it('gives up the uploads left alone too long, and keeps those still being sent', async () => {
    let time = 0;
    const sessions = createUploadSessions(() => time, 100, 10);
    const left = await sessions.open(UPLOAD);
    const kept = await sessions.open(UPLOAD);

    time = 90;
    await sessions.receive(kept.uploadId, 0, true);
    time = 150;

    expect((await sessions.stale()).map((one) => one.uploadId)).toEqual([left.uploadId]);
    await expect(sessions.find(left.uploadId, 'films')).resolves.toBeNull();
    expect(await sessions.find(kept.uploadId, 'films')).not.toBeNull();
  });
});
