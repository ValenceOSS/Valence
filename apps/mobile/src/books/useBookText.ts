import { useEffect, useState } from 'react';
import { contentsOfBook } from '@ValenceCore/books/contentsOfBook';
import { readBookDocument } from '@ValenceCore/books/readBookDocument';
import { typesetBlocksOf } from '@ValenceCore/books/typesetBlocksOf';
import { fetchBookDocument } from '@ValenceClient/books/fetchBooks';
import { readBookText } from '@ValenceClient/books/readBookText';
import { firstToShow } from '@ValenceClient/books/firstToShow';
import { streamFromThisServer } from '@ValenceMobile/platform/streamFromThisServer';
import type { BookContents } from '@ValenceContracts/schemas/Book';
import type { TypesetBlock } from '@ValenceContracts/schemas/BookText';

type BookTextPart = { blocks: TypesetBlock[]; html?: string };

type BookText = {
  parts: readonly (BookTextPart | undefined)[];
  contents: BookContents['contents'] | null;
  isWhole: boolean;
  isFailed: boolean;
};

const BOOKS_KEPT = 3;

const NOTHING_YET: BookText = { parts: [], contents: null, isWhole: false, isFailed: false };

const kept = new Map<string, BookText>();

/**
 * Keeps a book read whole, for the few books read most lately, so opening one again is immediate.
 *
 * @param key - Which book, and whether its HTML came with it.
 * @param text - What was read.
 */
const keep = (key: string, text: BookText): void => {
  kept.delete(key);
  kept.set(key, text);

  for (const [oldest] of kept) {
    if (kept.size <= BOOKS_KEPT) {
      break;
    }

    kept.delete(oldest);
  }
};

/**
 * Every part of a book that reflows, ready to set, as the server streams it: nothing at first, then
 * the part it opens at the moment that part arrives — or, where that part holds nothing, the first
 * after it that does — then the whole book and its contents once the
 * rest has. A server that does not stream books, or a stream that breaks off, is asked for each part in
 * turn instead, and each is read here. A book read whole lately is had at once.
 *
 * @param bookId - The book.
 * @param chapterId - Which of its files.
 * @param from - The part it opens at, read first; only the first one asked for counts.
 * @param partCount - How many parts it has, for a server asked a part at a time, or nothing until
 *   that is known.
 * @param listed - The contents the server listed, for a server asked a part at a time.
 * @param isWithHtml - Whether each part's HTML is wanted too, to draw it as a page that scrolls.
 * @param isWanted - Whether the book is to be read this way at all.
 * @returns The parts read so far, the contents once known, and whether it is all here or failed.
 */
const useBookText = (
  bookId: string,
  chapterId: string,
  from: number | null,
  partCount: number | null,
  listed: BookContents['contents'] | null,
  isWithHtml: boolean,
  isWanted: boolean,
): BookText => {
  const key = `${chapterId}:${String(isWithHtml)}`;
  const [read, setRead] = useState<{ key: string; text: BookText } | null>(null);
  const [opening, setOpening] = useState(from);
  const held = kept.get(key);

  if (opening === null && from !== null) {
    setOpening(from);
  }

  const isReady = isWanted && opening !== null && partCount !== null && listed !== null;

  useEffect(() => {
    if (!isReady || kept.has(key)) {
      return undefined;
    }

    const run = { isLive: true };
    const isGone = () => !run.isLive;
    const parts: (BookTextPart | undefined)[] = [];
    const got: { contents: BookContents['contents'] | null; isShown: boolean } = {
      contents: null,
      isShown: false,
    };

    void (async () => {
      const answered = await readBookText(
        bookId,
        chapterId,
        opening,
        isWithHtml,
        (line) => {
          if (line.kind === 'head') {
            parts.length = line.parts;
          } else if (line.kind === 'part') {
            parts[line.part] = {
              blocks: line.blocks,
              ...(line.html === undefined ? {} : { html: line.html }),
            };

            if (!got.isShown && !isGone() && firstToShow(parts, opening) !== null) {
              got.isShown = true;
              setRead({
                key,
                text: { parts: [...parts], contents: null, isWhole: false, isFailed: false },
              });
            }
          } else {
            got.contents = line.contents;
          }
        },
        streamFromThisServer,
      ).catch(() => 'failed' as const);

      const isAskedAPartAtATime = answered !== 'read' || got.contents === null;

      if (isAskedAPartAtATime) {
        const each = await Promise.all(
          Array.from({ length: partCount }, (_, part) =>
            fetchBookDocument(bookId, chapterId, part).catch(() => null),
          ),
        );

        each.forEach((html, part) => {
          parts[part] = {
            blocks: typesetBlocksOf(readBookDocument(html ?? '')),
            ...(isWithHtml ? { html: html ?? '' } : {}),
          };
        });
        got.contents = each.every((html) => html === null)
          ? null
          : contentsOfBook(
              listed,
              parts.map((part) => part?.blocks ?? []),
            );
      }

      if (isGone()) {
        return;
      }

      const whole: BookText =
        got.contents === null
          ? { parts, contents: null, isWhole: false, isFailed: true }
          : { parts, contents: got.contents, isWhole: true, isFailed: false };

      if (whole.isWhole) {
        keep(key, whole);
      }

      setRead({ key, text: whole });
    })();

    return () => {
      run.isLive = false;
    };
  }, [isReady, key, bookId, chapterId, isWithHtml, partCount, listed, opening]);

  return held ?? (read?.key === key ? read.text : NOTHING_YET);
};

export { useBookText };
