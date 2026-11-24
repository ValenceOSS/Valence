import { describe, expect, it } from 'vitest';
import { aViewing } from '@ValenceClient/testing/aViewing';
import { titleKeyOfViewing } from './titleKeyOfViewing';

describe('titleKeyOfViewing', () => {
  it('names a film by itself', () => {
    expect(titleKeyOfViewing(aViewing({ mediaItemId: 'film' }))).toBe('item:film');
  });

  it('names an episode by its series, or by the series’ name where the server gives no id', () => {
    const episode = aViewing({ mediaItemId: 'one', seriesTitle: 'Severance', seriesId: 'series' });

    expect(titleKeyOfViewing(episode)).toBe('show:series');
    expect(titleKeyOfViewing({ ...episode, seriesId: null })).toBe('show:Severance');
  });
});
