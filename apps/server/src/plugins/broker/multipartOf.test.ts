import { describe, expect, it } from 'vitest';
import { multipartOf } from './multipartOf';

describe('building a multipart form for a plugin', () => {
  it('sends text fields and a file, divided where the content type says', async () => {
    const { body, contentType } = multipartOf({
      seed: '1',
      file: {
        base64: Buffer.from([0, 1, 2]).toString('base64'),
        fileName: 'a.torrent',
        contentType: 'application/x-bittorrent',
      },
    });
    const read = await new Response(new Blob([new Uint8Array(body)]), {
      headers: { 'content-type': contentType },
    }).formData();
    const file = read.get('file');

    expect(read.get('seed')).toBe('1');
    expect(file instanceof Blob ? [...new Uint8Array(await file.arrayBuffer())] : null).toEqual([
      0, 1, 2,
    ]);
    expect(file instanceof File ? file.name : null).toBe('a.torrent');
  });

  it('keeps a quote or a line break in a name from breaking out of its header', () => {
    const { body } = multipartOf({ 'a"\r\nb': 'x' });

    expect(body.toString()).toContain('name="a___b"');
  });
});
