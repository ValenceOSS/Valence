import { describe, expect, it } from 'vitest';
import { whereToSaveADownload } from './whereToSaveADownload';

describe('whereToSaveADownload', () => {
  it('asks for the file as an attachment', () => {
    expect(whereToSaveADownload('00000000-0000-4000-8000-000000000001')).toBe(
      '/api/downloads/00000000-0000-4000-8000-000000000001/file?save=1',
    );
  });
});
