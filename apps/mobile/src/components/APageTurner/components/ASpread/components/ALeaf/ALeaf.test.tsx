import { act, render } from '@testing-library/react-native';
import { ARemotePicture } from '@ValenceMobile/components/ARemotePicture/ARemotePicture';
import { ALeaf } from './ALeaf';

jest.mock('@ValenceMobile/components/ARemotePicture/ARemotePicture', () => ({
  ARemotePicture: jest.fn(() => null),
}));

const theLastPicture = () => {
  const props = jest.mocked(ARemotePicture).mock.calls.at(-1)?.[0];

  if (props === undefined) {
    throw new Error('No picture was drawn.');
  }

  return props;
};

beforeEach(() => {
  jest.mocked(ARemotePicture).mockClear();
});

describe('ALeaf', () => {
  it('shows the whole page inside the leaf', async () => {
    await render(<ALeaf uri="http://one.local/p/1" fit="both" breadth={200} tall={600} />);

    expect(theLastPicture()).toMatchObject({ fit: 'contain', style: { height: 600, width: 200 } });
  });

  it('draws a page out to the leaf’s width once its shape is known', async () => {
    await render(<ALeaf uri="http://one.local/p/1" fit="width" breadth={200} tall={600} />);

    await act(() => {
      theLastPicture().onLoad?.({ width: 100, height: 400 });
    });

    expect(theLastPicture()).toMatchObject({ style: { height: 800, width: 200 } });
  });

  it('leaves a blank leaf with no picture at all', async () => {
    await render(<ALeaf uri={null} fit="both" breadth={200} tall={600} />);

    expect(ARemotePicture).not.toHaveBeenCalled();
  });
});
