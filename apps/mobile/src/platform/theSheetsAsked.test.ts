import { theSheetsAsked } from './theSheetsAsked';

describe('theSheetsAsked', () => {
  it('holds what is asked until it is answered, and tells whoever asked', () => {
    const onPicked = jest.fn();
    const listen = jest.fn();
    const stop = theSheetsAsked().subscribe(listen);

    theSheetsAsked().ask({ options: ['One', 'Two', 'Cancel'], cancelButtonIndex: 2 }, onPicked);

    expect(theSheetsAsked().read()?.sheet.options).toEqual(['One', 'Two', 'Cancel']);

    theSheetsAsked().answer(1);

    expect(onPicked).toHaveBeenCalledWith(1);
    expect(theSheetsAsked().read()).toBeNull();
    expect(listen).toHaveBeenCalledTimes(2);

    stop();
  });

  it('answers with the cancel choice where the sheet was put away', () => {
    const onPicked = jest.fn();

    theSheetsAsked().ask({ options: ['One', 'Cancel'], cancelButtonIndex: 1 }, onPicked);
    theSheetsAsked().answer(null);

    expect(onPicked).toHaveBeenCalledWith(1);
  });

  it('carries straight on to a question asked in answer to the last', () => {
    const second = jest.fn();

    theSheetsAsked().ask({ options: ['Add to a playlist', 'Cancel'], cancelButtonIndex: 1 }, () => {
      theSheetsAsked().ask({ options: ['Road trip', 'Cancel'], cancelButtonIndex: 1 }, second);
    });
    theSheetsAsked().answer(0);

    expect(theSheetsAsked().read()?.sheet.options).toEqual(['Road trip', 'Cancel']);

    theSheetsAsked().answer(0);

    expect(second).toHaveBeenCalledWith(0);
  });
});
