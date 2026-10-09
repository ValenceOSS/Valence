import { describe, expect, it } from 'vitest';
import { appleEditorialNotesIn } from './appleEditorialNotesIn';

const pageSaying = (data: string) =>
  `<html><head></head><body><script type="application/json" id="serialized-server-data">${data}</script></body></html>`;

describe('appleEditorialNotesIn', () => {
  it('reads the notes the album’s “more” sheet opens on, however deep the page keeps them', () => {
    const page = pageSaying(
      JSON.stringify([
        {
          data: {
            sections: [
              { items: [{ title: 'Short n’ Sweet' }] },
              {
                items: [
                  {
                    modalPresentationDescriptor: {
                      headerTitle: 'Short n’ Sweet',
                      paragraphText:
                        '  Some people kill their nemeses with kindness.\n\nOthers do not.  ',
                    },
                  },
                ],
              },
            ],
          },
        },
      ]),
    );

    expect(appleEditorialNotesIn(page)).toBe(
      'Some people kill their nemeses with kindness.\n\nOthers do not.',
    );
  });

  it('drops the markup that sets a title in italics', () => {
    const page = pageSaying(
      JSON.stringify({
        modalPresentationDescriptor: { paragraphText: 'You could say <i>The Wall</i> started.' },
      }),
    );

    expect(appleEditorialNotesIn(page)).toBe('You could say The Wall started.');
  });

  it('finds nothing on a page without notes, without its data, or with data that is not JSON', () => {
    expect(
      appleEditorialNotesIn(pageSaying(JSON.stringify({ data: { sections: [] } }))),
    ).toBeNull();
    expect(
      appleEditorialNotesIn(
        pageSaying(JSON.stringify({ modalPresentationDescriptor: { paragraphText: ' ' } })),
      ),
    ).toBeNull();
    expect(appleEditorialNotesIn('<html><body>Nothing here</body></html>')).toBeNull();
    expect(appleEditorialNotesIn(pageSaying('{not json'))).toBeNull();
  });
});
