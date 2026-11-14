import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OriginBadge } from './OriginBadge';

describe('OriginBadge', () => {
  it('says where a file came from', () => {
    render(<OriginBadge origin={{ source: 'download', via: 'qBittorrent', link: 'linked' }} />);

    expect(screen.getByText('Linked to a download · qBittorrent')).toBeInTheDocument();
  });

  it('says a file was found on the disk', () => {
    render(<OriginBadge origin={{ source: 'disk', via: null, link: 'alone' }} />);

    expect(screen.getByText('Found on disk')).toBeInTheDocument();
  });
});
