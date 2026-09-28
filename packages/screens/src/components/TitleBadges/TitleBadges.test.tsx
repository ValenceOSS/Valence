import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MediaDetailSchema } from '@ValenceContracts/schemas/Library';
import { TitleBadges } from './TitleBadges';

const detailWith = (
  metadata: { certification?: string | null; certificationRegion?: string | null },
  picture: { width: number; height: number; videoRange: string },
) =>
  MediaDetailSchema.parse({
    id: '9c858901-8a57-4791-81fe-4c455b099bc9',
    libraryId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
    title: 'Arrival',
    year: 2016,
    container: 'mkv',
    durationSeconds: 7200,
    videoCodec: 'hevc',
    videoBitDepth: 10,
    canCopySegments: true,
    videoIsInterlaced: false,
    bitrateKbps: 12000,
    audioStreams: [{ index: 1, codec: 'eac3', channels: 6, isDefault: true, isAtmos: false }],
    subtitleStreams: [],
    addedAt: '2026-09-01T00:00:00.000Z',
    metadata: { hasPoster: false, hasBackdrop: false, hasLogo: false, ...metadata },
    ...picture,
  });

const UHD = { width: 3840, height: 2160, videoRange: 'HDR10' };

describe('TitleBadges', () => {
  it('shows the certificate as its board issues it, then how it looks and sounds', () => {
    render(
      <TitleBadges detail={detailWith({ certification: '15', certificationRegion: 'GB' }, UHD)} />,
    );

    expect(screen.getByRole('img', { name: 'Rated 15 by the BBFC' })).toBeInTheDocument();
    expect(screen.getByText('4K')).toBeInTheDocument();
    expect(screen.getByText('HDR10')).toBeInTheDocument();
    expect(screen.getByText('Dolby Digital+')).toBeInTheDocument();
    expect(screen.getByText('5.1')).toBeInTheDocument();
  });

  it('leaves the certificate out where it has none', () => {
    render(<TitleBadges detail={detailWith({}, UHD)} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('4K')).toBeInTheDocument();
  });

  it('leaves the certificate out where nobody said whose board issued it', () => {
    render(<TitleBadges detail={detailWith({ certification: '15' }, UHD)} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('draws nothing while the title is still being read', () => {
    const { container } = render(<TitleBadges detail={null} />);

    expect(container).toBeEmptyDOMElement();
  });
});
