import { describe, expect, it } from 'vitest';
import { asAnAttachment } from './asAnAttachment';

describe('asAnAttachment', () => {
  it('saves the file under its title', () => {
    expect(asAnAttachment('Arrival')).toBe(
      `attachment; filename="Arrival.mp4"; filename*=UTF-8''Arrival.mp4`,
    );
  });

  it('keeps a title in any script in the encoded name, and plain text in the other', () => {
    const header = asAnAttachment('Amélie');

    expect(header).toContain('filename="Amlie.mp4"');
    expect(header).toContain(`filename*=UTF-8''Am%C3%A9lie.mp4`);
  });

  it('takes out what a file name or a header cannot hold', () => {
    expect(asAnAttachment('A/B: "C"\r\n')).toBe(
      `attachment; filename="A B C.mp4"; filename*=UTF-8''A%20B%20C.mp4`,
    );
  });

  it('still names a title with nothing left in it', () => {
    expect(asAnAttachment('???')).toContain('filename="Download.mp4"');
  });
});
