import { describe, expect, it } from 'vitest';
import { DOC_COMPONENTS } from '@ValenceDocs/components/DOC_COMPONENTS/DOC_COMPONENTS';

describe('DOC_COMPONENTS', () => {
  it.each(['h2', 'h3', 'h4', 'p', 'a', 'pre', 'code', 'img', 'table', 'Callout'])(
    'covers %s',
    (name) => {
      expect(DOC_COMPONENTS).toHaveProperty(name);
    },
  );
});
