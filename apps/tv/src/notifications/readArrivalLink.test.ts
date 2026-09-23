import { readArrivalLink } from '@ValenceTv/notifications/readArrivalLink';

describe('readArrivalLink', () => {
  it('reads a film the notice points to', () => {
    expect(readArrivalLink('/?item=abc')).toEqual({ kind: 'film', mediaId: 'abc' });
  });

  it('reads a programme the notice points to, among other things in the link', () => {
    expect(readArrivalLink('/?tab=home&show=the%20bear')).toEqual({
      kind: 'show',
      mediaId: 'the bear',
    });
  });

  it('points nowhere where there is no link', () => {
    expect(readArrivalLink(null)).toBeNull();
  });

  it('points nowhere where the link is to something else', () => {
    expect(readArrivalLink('/requests')).toBeNull();
    expect(readArrivalLink('/?item=')).toBeNull();
  });
});
