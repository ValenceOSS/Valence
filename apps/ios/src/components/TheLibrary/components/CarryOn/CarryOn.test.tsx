import { render, userEvent } from '@testing-library/react-native';
import { MediaSummarySchema } from '@ValenceContracts/schemas/Library';
import { CarryOn } from './CarryOn';

const aTitle = (id: string, title: string) =>
  MediaSummarySchema.parse({
    id,
    libraryId: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
    title,
    year: 2016,
    durationSeconds: 6960,
    width: 1920,
    height: 1080,
    videoCodec: 'hevc',
    videoRange: 'SDR',
    addedAt: '2026-01-01T00:00:00.000Z',
  });

const ARRIVAL = aTitle('3fa85f64-5717-4562-b3fc-2c963f66afa6', 'Arrival');

describe('CarryOn', () => {
  it('names itself, so it is not mistaken for the shelf below', async () => {
    const drawn = await render(
      <CarryOn items={[ARRIVAL]} howFarThrough={() => 0.5} onLookAt={jest.fn()} />,
    );

    expect(drawn.getByText('Continue watching')).toBeTruthy();
  });

  it('shows how far through each one they got', async () => {
    const drawn = await render(
      <CarryOn items={[ARRIVAL]} howFarThrough={() => 0.5} onLookAt={jest.fn()} />,
    );

    expect(
      drawn.getByRole('progressbar', { name: 'How far through Arrival', value: { now: 50 } }),
    ).toBeTruthy();
  });

  it('opens the one they pressed', async () => {
    const onLookAt = jest.fn();
    const drawn = await render(
      <CarryOn items={[ARRIVAL]} howFarThrough={() => 0.5} onLookAt={onLookAt} />,
    );

    await userEvent.press(drawn.getByLabelText('Arrival'));

    expect(onLookAt).toHaveBeenCalledWith(ARRIVAL.id);
  });

  it('draws nothing at all where there is nothing to carry on with', async () => {
    const drawn = await render(<CarryOn items={[]} howFarThrough={() => 0} onLookAt={jest.fn()} />);

    expect(drawn.toJSON()).toBeNull();
  });
});
