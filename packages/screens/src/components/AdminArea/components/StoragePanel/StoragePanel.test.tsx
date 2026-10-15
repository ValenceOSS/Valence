import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { StoragePanel } from './StoragePanel';
import type { Bucket } from '@ValenceContracts/schemas/Bucket';

const fetchBuckets = vi.hoisted(() => vi.fn());
const removeBucket = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/admin/fetchBuckets', () => ({
  fetchBuckets,
  removeBucket,
  addBucket: vi.fn(),
  changeBucket: vi.fn(),
  testBucket: vi.fn(),
}));

const BUCKET: Bucket = {
  id: 'films',
  name: 'Films in the cloud',
  provider: 'Cloudflare',
  endpoint: 'https://abc.r2.cloudflarestorage.com',
  region: '',
  bucket: 'media',
  prefix: '',
  accessKeyId: 'key',
  path: '/buckets/films',
  status: { state: 'failed', reason: 'AccessDenied: Access Denied' },
};

const draw = () =>
  render(
    <CacheScope>
      <StoragePanel />
    </CacheScope>,
  );

beforeEach(() => {
  fetchBuckets.mockReset().mockResolvedValue({ canMount: true, buckets: [BUCKET] });
  removeBucket.mockReset().mockResolvedValue(null);
});

describe('StoragePanel', () => {
  it('lists each bucket with the folder it is mounted on, and why its mount failed', async () => {
    draw();

    expect(await screen.findByText('Films in the cloud')).toBeInTheDocument();
    expect(screen.getByText('/buckets/films')).toBeInTheDocument();
    expect(screen.getByText('AccessDenied: Access Denied')).toBeInTheDocument();
  });

  it('says so where this server cannot mount buckets', async () => {
    fetchBuckets.mockResolvedValue({ canMount: false, buckets: [] });

    draw();

    expect(await screen.findByRole('alert')).toHaveTextContent(/can’t mount buckets/u);
  });

  it('removes a bucket', async () => {
    draw();

    await userEvent.click(await screen.findByRole('button', { name: 'Remove Films in the cloud' }));

    await waitFor(() => {
      expect(removeBucket).toHaveBeenCalledWith('films');
    });
  });
});
