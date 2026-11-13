import { describe, expect, it } from 'vitest';
import { UPLOAD_PICTURE } from './UPLOAD_PICTURE';
import { uploadPictureAddress } from './uploadPictureAddress';

describe('UPLOAD_PICTURE', () => {
  it('begins every address an uploaded picture is kept under', () => {
    expect(
      uploadPictureAddress('00000000-0000-4000-8000-000000000001').startsWith(UPLOAD_PICTURE),
    ).toBe(true);
  });
});
