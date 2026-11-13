import { createElement as mockCreateElement } from 'react';
import { Text as mockText } from 'react-native';
import { render, userEvent } from '@testing-library/react-native';
import { aCatalogueTitle } from '@ValenceClient/testing/aCatalogueTitle';
import { useRequestableKinds } from '@ValenceClient/requests/useRequestableKinds';
import { APersonTimeline } from './APersonTimeline';
import type { PersonCredit } from '@ValenceContracts/schemas/CatalogueTitle';

jest.mock('@ValenceClient/requests/useRequestableKinds');

jest.mock('@keyline-icons/react-native', () => ({
  ...jest.requireActual<object>('@keyline-icons/react-native'),
  Check: () => mockCreateElement(mockText, null, 'ticked'),
}));

/**
 * A credit on a film not on this server, numbered so each in a list is its own.
 *
 * @param at - Which credit it is.
 * @param overrides - Anything about it that matters to the test.
 * @returns The credit.
 */
const aCredit = (at: number, overrides: Partial<PersonCredit> = {}): PersonCredit => ({
  ...aCatalogueTitle({ id: `film-${at.toString()}`, title: `Film ${at.toString()}` }),
  role: null,
  episodeCount: null,
  ...overrides,
});

const HERE = { status: 'library', mediaId: 'm-1', requestId: null, requestState: null } as const;

const EIGHT = Array.from({ length: 8 }, (_, at) => aCredit(at + 1));

beforeEach(() => {
  jest
    .mocked(useRequestableKinds)
    .mockReset()
    .mockReturnValue(new Set(['film', 'series']));
});

describe('APersonTimeline', () => {
  it('shows the first six credits until more are asked for', async () => {
    const drawn = await render(<APersonTimeline credits={EIGHT} />);

    expect(drawn.getByText('Timeline')).toBeTruthy();
    expect(drawn.getByText('Film 6')).toBeTruthy();
    expect(drawn.queryByText('Film 7')).toBeNull();

    await userEvent.press(drawn.getByRole('button', { name: 'Show more' }));

    expect(drawn.getByText('Film 7')).toBeTruthy();
    expect(drawn.getByText('Film 8')).toBeTruthy();
    expect(drawn.queryByRole('button', { name: 'Show more' })).toBeNull();
  });

  it('offers no more where six or fewer are all there is', async () => {
    const drawn = await render(<APersonTimeline credits={EIGHT.slice(0, 6)} />);

    expect(drawn.getByText('Film 6')).toBeTruthy();
    expect(drawn.queryByRole('button', { name: 'Show more' })).toBeNull();
  });

  it('says how each was credited, and its year', async () => {
    const drawn = await render(
      <APersonTimeline
        credits={[aCredit(1, { kind: 'series', role: 'Mark', episodeCount: 19, year: 2022 })]}
      />,
    );

    expect(drawn.getByText('19 episodes as Mark')).toBeTruthy();
    expect(drawn.getByText('2022')).toBeTruthy();
  });

  it('ticks only the credits on this server', async () => {
    const drawn = await render(
      <APersonTimeline credits={[aCredit(1, { standing: HERE }), aCredit(2), aCredit(3)]} />,
    );

    expect(drawn.getAllByText('ticked', { includeHiddenElements: true })).toHaveLength(1);
  });

  it('opens a credit for whoever may ask for things', async () => {
    const onAsk = jest.fn();
    const drawn = await render(
      <APersonTimeline credits={[aCredit(1, { kind: 'series' })]} onAsk={onAsk} />,
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Film 1' }));

    expect(onAsk).toHaveBeenCalledWith('series', 'film-1');
  });

  it('leaves shut a credit of a kind the server takes no requests for, unless it is here', async () => {
    jest.mocked(useRequestableKinds).mockReturnValue(new Set(['film']));
    const onAsk = jest.fn();
    const drawn = await render(
      <APersonTimeline
        credits={[
          aCredit(1),
          aCredit(2, { kind: 'series' }),
          aCredit(3, { kind: 'series', standing: HERE }),
        ]}
        onAsk={onAsk}
      />,
    );

    expect(drawn.getByRole('button', { name: 'Film 1' })).toBeTruthy();
    expect(drawn.queryByRole('button', { name: 'Film 2' })).toBeNull();
    expect(drawn.getByText('Film 2')).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Film 3' })).toBeTruthy();
  });

  it('opens nothing for whoever may not', async () => {
    const drawn = await render(<APersonTimeline credits={[aCredit(1)]} />);

    expect(drawn.getByText('Film 1')).toBeTruthy();
    expect(drawn.queryByRole('button', { name: 'Film 1' })).toBeNull();
  });

  it('draws nothing for somebody with no credits', async () => {
    const drawn = await render(<APersonTimeline credits={[]} />);

    expect(drawn.toJSON()).toBeNull();
  });
});
