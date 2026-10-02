import { describe, expect, it } from 'vitest';
import { readXmlElements } from './readXmlElements';

describe('readXmlElements', () => {
  it('reads elements, their attributes and their children, decoding what was escaped', () => {
    const read = readXmlElements(
      `<?xml version="1.0"?><MediaContainer size="1"><User id="1" title="Lee &amp; Co &#x41;&#66;" note='single'><Server name="Shed"/></User></MediaContainer>`,
    );

    expect(read).toEqual([
      {
        name: 'MediaContainer',
        attributes: { size: '1' },
        children: [
          {
            name: 'User',
            attributes: { id: '1', title: 'Lee & Co AB', note: 'single' },
            children: [{ name: 'Server', attributes: { name: 'Shed' }, children: [] }],
          },
        ],
      },
    ]);
  });

  it('leaves an unknown entity as written, and copes with a closing tag that was never opened', () => {
    expect(readXmlElements('<a x="&nope;"></b></a><c/>')).toEqual([
      { name: 'a', attributes: { x: '&nope;' }, children: [] },
      { name: 'c', attributes: {}, children: [] },
    ]);
  });
});
