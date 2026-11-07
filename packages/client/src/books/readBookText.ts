import { RequestFailed } from '@ValenceClient/query/RequestFailed';
import { BookTextLineSchema } from '@ValenceContracts/schemas/BookText';
import type { BookTextLine } from '@ValenceContracts/schemas/BookText';

/**
 * Reads a book that reflows as the server streams it, a line at a time as each arrives: how many
 * parts it has, then each part ready to set, starting with the one asked for, then its contents.
 * Where the answer cannot be read as it arrives, it is read whole and handed out the same way.
 *
 * @param bookId - The book.
 * @param chapterId - Which of its files.
 * @param from - The part to start with.
 * @param isWithHtml - Whether each part's cleaned HTML is wanted as well.
 * @param onLine - Told each line as it is read.
 * @param ask - How to ask the server, where it is not the ordinary fetch.
 * @returns Whether the book was read, or the server does not offer it this way.
 */
const readBookText = async (
  bookId: string,
  chapterId: string,
  from: number,
  isWithHtml: boolean,
  onLine: (line: BookTextLine) => void,
  ask: (path: string, init?: RequestInit) => Promise<Response> = fetch,
): Promise<'read' | 'missing'> => {
  const path = `/api/books/${bookId}/chapters/${chapterId}/text?from=${from.toString()}${isWithHtml ? '&html=true' : ''}`;
  const response = await ask(path, { headers: { accept: 'application/x-ndjson' } });

  if (response.status === 404) {
    return 'missing';
  }

  if (!response.ok) {
    throw new RequestFailed(path, response.status);
  }

  let held = '';

  const take = (text: string, isLast: boolean) => {
    const lines = `${held}${text}`.split('\n');

    held = isLast ? '' : (lines.pop() ?? '');

    for (const line of lines) {
      if (line.trim() !== '') {
        const read = BookTextLineSchema.safeParse(JSON.parse(line));

        if (read.success) {
          onLine(read.data);
        }
      }
    }
  };

  const body: ReadableStream<Uint8Array> | null = response.body;
  const reader = body?.getReader();

  if (reader === undefined) {
    take(await response.text(), true);

    return 'read';
  }

  const decoder = new TextDecoder();

  for (;;) {
    const chunk: { done: boolean; value?: Uint8Array | undefined } = await reader.read();

    if (chunk.done) {
      break;
    }

    take(decoder.decode(chunk.value, { stream: true }), false);
  }

  take(decoder.decode(), true);

  return 'read';
};

export { readBookText };
