import { describe, expect, it } from 'vitest';
import { markTheDocument } from './markTheDocument';

const HTML = 'http://www.w3.org/1999/xhtml';

const anUnparsedDocument = (): Document => document.implementation.createDocument(null, null, null);

describe('markTheDocument', () => {
  it('marks a document that has already been parsed', () => {
    const within = document.implementation.createHTMLDocument();

    markTheDocument(within, 'win32');

    expect(within.querySelector('html')?.dataset['valenceDesktop']).toBe('true');
  });

  it('marks which platform the window is on, which decides where its controls are drawn', () => {
    const within = document.implementation.createHTMLDocument();

    markTheDocument(within, 'darwin');

    expect(within.querySelector('html')?.dataset['valencePlatform']).toBe('darwin');
  });

  it('does not throw where the page has not been parsed yet, which is when a preload runs', () => {
    expect(() => {
      markTheDocument(anUnparsedDocument(), 'win32');
    }).not.toThrow();
  });

  it('marks the root once the parser puts one there', async () => {
    const within = anUnparsedDocument();

    markTheDocument(within, 'win32');

    within.append(within.createElementNS(HTML, 'html'));

    await new Promise((settle) => {
      setTimeout(settle, 0);
    });

    expect(within.querySelector('html')?.dataset['valenceDesktop']).toBe('true');
  });

  it('stops watching once it has marked one, so nothing is left observing the document', async () => {
    const within = anUnparsedDocument();

    markTheDocument(within, 'win32');

    within.append(within.createElementNS(HTML, 'html'));

    await new Promise((settle) => {
      setTimeout(settle, 0);
    });

    const root = within.querySelector('html');
    root?.remove();
    within.append(within.createElementNS(HTML, 'html'));

    await new Promise((settle) => {
      setTimeout(settle, 0);
    });

    expect(within.querySelector('html')?.dataset['valenceDesktop']).toBeUndefined();
  });
});
