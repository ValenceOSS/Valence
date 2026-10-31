import { showActionSheet } from './showActionSheet';
import { theSheetsAsked } from './theSheetsAsked';

describe('showActionSheet', () => {
  it('asks in Valence’s own sheet, and tells whoever asked what was picked', () => {
    const onPicked = jest.fn();

    showActionSheet(
      { title: 'Arrival', options: ['Hide', 'Cancel'], cancelButtonIndex: 1 },
      onPicked,
    );

    expect(theSheetsAsked().read()?.sheet.title).toBe('Arrival');

    theSheetsAsked().answer(0);

    expect(onPicked).toHaveBeenCalledWith(0);
  });
});
