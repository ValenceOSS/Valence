import { describe, expect, it } from 'vitest';
import { TITLE_PART_LOOKS } from './TITLE_PART_LOOKS';

describe('TITLE_PART_LOOKS', () => {
  it('names and colours what is not out yet and what nobody asked for', () => {
    expect(TITLE_PART_LOOKS.waiting.label).toBe('Not out yet');
    expect(TITLE_PART_LOOKS.notAsked).toMatchObject({ label: 'Not asked for', tone: 'quiet' });
  });

  it('colours a failed episode as danger', () => {
    expect(TITLE_PART_LOOKS.failed).toMatchObject({ tone: 'danger', cell: 'bg-danger' });
  });
});
