import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { notify } from '@ValenceUI/notify';
import { CorrectionPicker } from './CorrectionPicker';

vi.mock('@ValenceUI/notify', () => ({
  notify: { worked: vi.fn(), failed: vi.fn(), say: vi.fn() },
}));

type Match = { id: string; name: string };

const MATCH: Match = { id: 'a1', name: 'The Black Parade' };

const picker = (overrides: Partial<Parameters<typeof CorrectionPicker<Match>>[0]> = {}) => {
  const props = {
    title: 'The Black Parade',
    detail: 'Choose the album these files are.',
    searchLabel: 'Album',
    startingQuery: 'Black Parade',
    search: vi.fn(() => Promise.resolve([MATCH])),
    drawMatches: (matches: Match[], busyId: string | null, choose: (match: Match) => void) => (
      <ul>
        {matches.map((match) => (
          <li key={match.id}>
            <button
              type="button"
              data-busy={busyId === match.id}
              onClick={() => {
                choose(match);
              }}
            >
              {match.name}
            </button>
          </li>
        ))}
      </ul>
    ),
    keyOf: (match: Match) => match.id,
    choose: vi.fn(() => Promise.resolve(null)),
    forget: vi.fn(() => Promise.resolve(null)),
    onChanged: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };

  render(<CorrectionPicker {...props} />);

  return props;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('CorrectionPicker', () => {
  it('starts from the name it was given and searches it', async () => {
    const props = picker();

    expect(screen.getByLabelText('Album')).toHaveValue('Black Parade');

    await userEvent.click(screen.getByRole('button', { name: 'Search' }));

    expect(props.search).toHaveBeenCalledWith('Black Parade');
    expect(await screen.findByRole('button', { name: 'The Black Parade' })).toBeInTheDocument();
  });

  it('says when nothing came back', async () => {
    picker({ search: vi.fn(() => Promise.resolve([])) });

    await userEvent.click(screen.getByRole('button', { name: 'Search' }));

    expect(await screen.findByText('No results for that name.')).toBeInTheDocument();
  });

  it('will not search for nothing', async () => {
    picker();

    await userEvent.clear(screen.getByLabelText('Album'));

    expect(screen.getByRole('button', { name: 'Search' })).toBeDisabled();
  });

  it('records a choice, says so and closes', async () => {
    const props = picker();

    await userEvent.click(screen.getByRole('button', { name: 'Search' }));
    await userEvent.click(await screen.findByRole('button', { name: 'The Black Parade' }));

    await waitFor(() => {
      expect(props.onClose).toHaveBeenCalled();
    });
    expect(props.choose).toHaveBeenCalledWith(MATCH);
    expect(props.onChanged).toHaveBeenCalled();
    expect(notify.worked).toHaveBeenCalledWith('Match updated.');
  });

  it('says why a choice could not be kept and stays open', async () => {
    const props = picker({
      choose: vi.fn(() => Promise.resolve('The catalogue is not answering.')),
    });

    await userEvent.click(screen.getByRole('button', { name: 'Search' }));
    await userEvent.click(await screen.findByRole('button', { name: 'The Black Parade' }));

    await waitFor(() => {
      expect(notify.failed).toHaveBeenCalledWith('The catalogue is not answering.');
    });
    expect(props.onClose).not.toHaveBeenCalled();
    expect(props.onChanged).not.toHaveBeenCalled();
  });

  it('forgets an earlier choice so the files are read again', async () => {
    const props = picker();

    await userEvent.click(screen.getByRole('button', { name: 'Use details from the files' }));

    await waitFor(() => {
      expect(props.onClose).toHaveBeenCalled();
    });
    expect(props.forget).toHaveBeenCalled();
    expect(notify.worked).toHaveBeenCalledWith(
      'It will use the details from its files after the next scan.',
    );
  });

  it('says why an earlier choice could not be forgotten', async () => {
    const props = picker({ forget: vi.fn(() => Promise.resolve('Nothing was corrected.')) });

    await userEvent.click(screen.getByRole('button', { name: 'Use details from the files' }));

    await waitFor(() => {
      expect(notify.failed).toHaveBeenCalledWith('Nothing was corrected.');
    });
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it('draws nothing while closed', () => {
    picker({ title: null });

    expect(screen.queryByLabelText('Album')).not.toBeInTheDocument();
  });
});
