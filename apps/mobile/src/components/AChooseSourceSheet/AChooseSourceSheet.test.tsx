import { render, userEvent } from '@testing-library/react-native';
import { aStreamOffer } from '@ValenceClient/testing/aStreamOffer';
import { AChooseSourceSheet } from './AChooseSourceSheet';
import type { AChooseSourceSheetProps } from './AChooseSourceSheet.types';

const drawIt = async (overrides: Partial<AChooseSourceSheetProps> = {}) => {
  const props: AChooseSourceSheetProps = {
    title: 'Dune',
    isOpen: true,
    offers: {
      offers: [
        aStreamOffer({ id: 'hd' }),
        aStreamOffer({ id: 'uhd', resolution: '2160p' }),
        aStreamOffer({ id: 'later', isReady: false }),
      ],
      problems: [],
    },
    isLooking: false,
    isFailed: false,
    bestId: 'hd',
    isPlaying: false,
    problem: null,
    onTryAgain: jest.fn(),
    onChoose: jest.fn(),
    onClose: jest.fn(),
    ...overrides,
  };

  return { ...props, drawn: await render(<AChooseSourceSheet {...props} />) };
};

describe('AChooseSourceSheet', () => {
  it('lists the streams that start straight away under their resolution, the best marked', async () => {
    const { drawn } = await drawIt();

    expect(drawn.getByText('4K')).toBeTruthy();
    expect(drawn.getByText('1080p')).toBeTruthy();
    expect(drawn.getByText('Best match')).toBeTruthy();
    expect(drawn.getAllByRole('button', { name: /^Play / })).toHaveLength(2);
  });

  it('plays the stream pressed', async () => {
    const { drawn, onChoose } = await drawIt();

    await userEvent.press(drawn.getByRole('button', { name: /^Play 4K/ }));

    expect(onChoose).toHaveBeenCalledWith('uhd');
  });

  it('shows the streams that download first when asked', async () => {
    const { drawn } = await drawIt();

    await userEvent.press(drawn.getByRole('button', { name: /first/ }));

    expect(drawn.getAllByRole('button', { name: /^Play / })).toHaveLength(3);
  });

  it('asks again where no source has the film', async () => {
    const { drawn, onTryAgain } = await drawIt({ offers: { offers: [], problems: [] } });

    expect(drawn.getByText('No sources found')).toBeTruthy();

    await userEvent.press(drawn.getByRole('button', { name: 'Try again' }));

    expect(onTryAgain).toHaveBeenCalled();
  });

  it('says it is looking while the sources are asked', async () => {
    const { drawn } = await drawIt({ offers: undefined, isLooking: true });

    expect(drawn.getByText(/Looking/)).toBeTruthy();
  });

  it('says why the stream chosen would not play, while it is still out', async () => {
    const { drawn } = await drawIt({ problem: 'The source is still getting it ready.' });

    expect(drawn.getByText('The source is still getting it ready.')).toBeTruthy();
  });
});
