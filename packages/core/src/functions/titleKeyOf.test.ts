import { describe, expect, it } from 'vitest';
import { titleKeyOf } from './titleKeyOf';

describe('titleKeyOf', () => {
  it('knows an episode by its series, whichever episode it is', () => {
    expect(titleKeyOf({ id: 'one', seriesId: 'show', seriesTitle: 'Show' })).toBe('show');
    expect(titleKeyOf({ id: 'two', seriesId: 'show', seriesTitle: 'Show' })).toBe('show');
  });

  it('knows an episode matched to no series by its series title', () => {
    expect(titleKeyOf({ id: 'one', seriesId: null, seriesTitle: 'Show' })).toBe('Show');
  });

  it('knows a film by itself', () => {
    expect(titleKeyOf({ id: 'film', seriesId: null, seriesTitle: null })).toBe('film');
    expect(titleKeyOf({ id: 'film', seriesId: null })).toBe('film');
  });
});
