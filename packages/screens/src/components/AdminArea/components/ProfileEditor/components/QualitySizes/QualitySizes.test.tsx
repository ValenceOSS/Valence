import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RECOMMENDED_QUALITY_SIZES } from '@ValenceContracts/schemas/QualityProfile';
import { QualitySizes } from './QualitySizes';

describe('QualitySizes', () => {
  it('shows the limits of each quality the profile takes, best first', () => {
    render(
      <QualitySizes
        resolutions={['1080p', '720p']}
        sources={['bluray', 'webdl']}
        sizes={[
          { source: 'webdl', resolution: '1080p', minMb: 750, maxMb: null },
          { source: 'bluray', resolution: '1080p', minMb: 3024, maxMb: 12_000 },
          { source: 'webdl', resolution: '720p', minMb: null, maxMb: 2048 },
        ]}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getAllByRole('listitem').map((row) => row.textContent)).toEqual([
      'Blu-ray 1080p3.0 GB an hour to 11.7 GB an hour',
      'WEB-DL 1080pAt least 750 MB an hour',
      'Blu-ray 720pAny size',
      'WEB-DL 720pNo more than 2.0 GB an hour',
    ]);
  });

  it('changes a quality’s limits as its handles move, forgetting one with none left', async () => {
    const onChange = vi.fn();

    render(
      <QualitySizes
        resolutions={['1080p']}
        sources={['webdl']}
        sizes={[{ source: 'webdl', resolution: '1080p', minMb: 750, maxMb: null }]}
        onChange={onChange}
      />,
    );

    screen.getByRole('slider', { name: 'Largest for WEB-DL 1080p' }).focus();
    await userEvent.keyboard('{ArrowLeft}');

    expect(onChange).toHaveBeenLastCalledWith([
      { source: 'webdl', resolution: '1080p', minMb: 750, maxMb: 39_601 },
    ]);

    screen.getByRole('slider', { name: 'Smallest for WEB-DL 1080p' }).focus();
    await userEvent.keyboard('{Home}');

    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('puts back the recommended sizes, and asks for a quality where none is taken', async () => {
    const onChange = vi.fn();

    render(<QualitySizes resolutions={[]} sources={[]} sizes={[]} onChange={onChange} />);

    expect(screen.getByText(/Tick a resolution and a source/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /recommended sizes/ }));

    expect(onChange).toHaveBeenCalledWith([...RECOMMENDED_QUALITY_SIZES]);
  });
});
