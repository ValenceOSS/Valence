import { describe, expect, it } from 'vitest';
import { partsOfCollaboration } from './partsOfCollaboration';

describe('partsOfCollaboration', () => {
  it('names each artist a collaboration credits, the one asked about first', () => {
    expect(partsOfCollaboration('One & Another', 'One')).toEqual(['One', 'Another']);
    expect(partsOfCollaboration('Another x one', 'One')).toEqual(['one', 'Another']);
    expect(partsOfCollaboration('One, Two and Three', 'Three')).toEqual(['Three', 'One', 'Two']);
    expect(partsOfCollaboration('One feat. Another', 'Another')).toEqual(['Another', 'One']);
  });

  it('finds no collaboration where the credit is the artist alone or does not name them', () => {
    expect(partsOfCollaboration('One', 'One')).toBeNull();
    expect(partsOfCollaboration('Two & Three', 'One')).toBeNull();
    expect(partsOfCollaboration('Oneself & Another', 'One')).toBeNull();
  });
});
