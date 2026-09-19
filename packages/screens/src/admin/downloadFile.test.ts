import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadFile } from './downloadFile';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('downloadFile', () => {
  it('hands over a file named as asked', () => {
    const clicked: string[] = [];

    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:one');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function click(
      this: HTMLAnchorElement,
    ) {
      clicked.push(this.download);
    });

    downloadFile('release.torrent', new Blob(['d']));

    expect(clicked).toStrictEqual(['release.torrent']);
  });

  it('lets go of the file once it has been handed over', () => {
    const released = vi.fn();

    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:one');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(released);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    downloadFile('release.torrent', new Blob(['d']));

    expect(released).toHaveBeenCalledWith('blob:one');
  });

  it('leaves nothing behind in the page', () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:one');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    downloadFile('release.torrent', new Blob(['d']));

    expect(document.querySelectorAll('a')).toHaveLength(0);
  });
});
