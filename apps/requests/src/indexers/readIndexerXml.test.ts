import { describe, expect, it } from 'vitest';
import { readIndexerXml } from './readIndexerXml';

describe('readIndexerXml', () => {
  it('reads a document, dropping the namespace from its tags', () => {
    expect(
      readIndexerXml(
        '<rss><channel><item><title>A</title><torznab:attr name="seeders" value="3"/></item></channel></rss>',
      ),
    ).toEqual({
      rss: {
        channel: { item: [{ title: 'A', attr: [{ '@name': 'seeders', '@value': '3' }] }] },
      },
    });
  });

  it('names a refused key', () => {
    expect(() =>
      readIndexerXml('<error code="100" description="Incorrect user credentials"/>'),
    ).toThrow('The indexer refused the API key');
  });

  it('passes on what any other error said', () => {
    expect(() => readIndexerXml('<error code="500" description="Request limit reached"/>')).toThrow(
      'The indexer said: Request limit reached',
    );
  });

  it('still says something for an error that says nothing', () => {
    expect(() => readIndexerXml('<error code="900"/>')).toThrow('The indexer said: error 900');
    expect(() => readIndexerXml('<error/>')).toThrow('The indexer said: error without a code');
  });

  it('refuses an answer that is not XML', () => {
    expect(() => readIndexerXml('{"error":"nope"}')).toThrow(
      'The indexer answered something that was not Torznab or Newznab',
    );
  });
});
