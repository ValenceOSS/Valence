import { OpenAPIHono } from '@hono/zod-openapi';
import { describe, expect, it, vi } from 'vitest';
import { createMemoryBookService } from './createMemoryBookService';
import { registerListeningRoutes } from './registerListeningRoutes';
import type { Book, BookChapter } from '@ValenceContracts/schemas/Book';
import type { TranscoderStreamedFile } from '@ValenceServer/transcoder/TranscoderClient';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

const BOOK_ID = '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0001';

const TRACK_ONE = '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0002';

const TRACK_TWO = '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0003';

const TEXT_ID = '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0004';

const DUNE: Book = {
  id: BOOK_ID,
  libraryId: '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0009',
  title: 'Dune',
  layout: 'reflow',
  direction: 'leftToRight',
  year: 1965,
  overview: null,
  genres: null,
  authors: ['Frank Herbert'],
  rating: null,
  hasCover: true,
  chapterCount: 3,
  hasText: true,
  hasAudio: true,
  addedAt: '2026-09-23T00:00:00.000Z',
  updatedAt: '2026-09-23T00:00:00.000Z',
};

const aChapter = (id: string, number: number, format: BookChapter['format']): BookChapter => ({
  id,
  bookId: BOOK_ID,
  number,
  title: `Part ${number.toString()}`,
  format,
  pageCount: null,
  durationSeconds: format === 'epub' ? null : 1000,
  addedAt: '2026-09-23T00:00:00.000Z',
});

const READER: Viewer = {
  kind: 'account',
  accountId: 'account-1',
  profileId: 'profile-1',
  isAdministrator: false,
};

const aStream = (status: number, contentRange: string | null): TranscoderStreamedFile => ({
  body: new ReadableStream({
    start: (controller) => {
      controller.enqueue(new Uint8Array([1, 2, 3]));
      controller.close();
    },
  }),
  contentType: 'application/octet-stream',
  status,
  contentRange,
  contentLength: '3',
});

const anApp = ({
  viewer = READER,
  reach = true,
  stream = vi.fn(() =>
    Promise.resolve<TranscoderStreamedFile | null>(aStream(206, 'bytes 0-2/3000')),
  ),
}: {
  viewer?: Viewer | null;
  reach?: boolean;
  stream?: (path: string, range: string | null) => Promise<TranscoderStreamedFile | null>;
} = {}) => {
  const app = new OpenAPIHono();
  const books = createMemoryBookService({
    books: [DUNE],
    chapters: [
      aChapter(TEXT_ID, 0, 'epub'),
      aChapter(TRACK_ONE, 1, 'm4b'),
      aChapter(TRACK_TWO, 2, 'm4b'),
    ],
  });

  registerListeningRoutes(app, {
    books,
    viewerOf: () => Promise.resolve(viewer),
    profileOf: () => Promise.resolve(viewer === null ? null : 'profile-1'),
    isInReach: () => Promise.resolve(reach),
    streamFile: stream,
  });

  return { app, stream };
};

const put = (app: OpenAPIHono, body: object) =>
  app.request(`/api/books/${BOOK_ID}/listening`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('registerListeningRoutes', () => {
  it('streams a track from where the browser asks, named as the sound it is', async () => {
    const { app, stream } = anApp();

    const answer = await app.request(`/api/books/${BOOK_ID}/chapters/${TRACK_ONE}/audio`, {
      headers: { range: 'bytes=0-2' },
    });

    expect(answer.status).toBe(206);
    expect(answer.headers.get('content-type')).toBe('audio/mp4');
    expect(answer.headers.get('accept-ranges')).toBe('bytes');
    expect(answer.headers.get('content-range')).toBe('bytes 0-2/3000');
    expect(stream).toHaveBeenCalledWith(`/books/${TRACK_ONE}.m4b`, 'bytes=0-2');
  });

  it('will not stream a chapter that is read rather than heard', async () => {
    const { app, stream } = anApp();

    const answer = await app.request(`/api/books/${BOOK_ID}/chapters/${TEXT_ID}/audio`);

    expect(answer.status).toBe(404);
    expect(stream).not.toHaveBeenCalled();
  });

  it('streams nothing to somebody who may not see the book, or nobody at all', async () => {
    expect(
      (
        await anApp({ reach: false }).app.request(
          `/api/books/${BOOK_ID}/chapters/${TRACK_ONE}/audio`,
        )
      ).status,
    ).toBe(404);
    expect(
      (
        await anApp({ viewer: null }).app.request(
          `/api/books/${BOOK_ID}/chapters/${TRACK_ONE}/audio`,
        )
      ).status,
    ).toBe(401);
  });

  it('keeps where somebody has got to, and gives it back', async () => {
    const { app } = anApp();

    expect((await put(app, { chapterId: TRACK_TWO, positionSeconds: 42 })).status).toBe(204);

    const answer = await app.request(`/api/books/${BOOK_ID}/listening`);

    expect(await answer.json()).toMatchObject({
      progress: { bookId: BOOK_ID, chapterId: TRACK_TWO, positionSeconds: 42, isFinished: false },
    });
  });

  it('lists what somebody is listening to, with how far into the whole book they are', async () => {
    const { app } = anApp();

    await put(app, { chapterId: TRACK_TWO, positionSeconds: 42 });

    const answer = await app.request('/api/listening');

    expect(await answer.json()).toMatchObject({
      listenings: [
        {
          book: { id: BOOK_ID },
          chapterId: TRACK_TWO,
          chapterTitle: 'Part 2',
          positionSeconds: 42,
          heardSeconds: 1042,
          durationSeconds: 2000,
        },
      ],
    });
  });

  it('refuses a place in a chapter that is read, not heard', async () => {
    expect((await put(anApp().app, { chapterId: TEXT_ID, positionSeconds: 1 })).status).toBe(404);
  });

  it('forgets where somebody had got to', async () => {
    const { app } = anApp();

    await put(app, { chapterId: TRACK_ONE, positionSeconds: 10 });
    await app.request(`/api/books/${BOOK_ID}/listening`, { method: 'DELETE' });

    expect(await (await app.request(`/api/books/${BOOK_ID}/listening`)).json()).toEqual({
      progress: null,
    });
  });

  it('keeps nothing for nobody', async () => {
    expect(
      (await put(anApp({ viewer: null }).app, { chapterId: TRACK_ONE, positionSeconds: 1 })).status,
    ).toBe(401);
  });
});
