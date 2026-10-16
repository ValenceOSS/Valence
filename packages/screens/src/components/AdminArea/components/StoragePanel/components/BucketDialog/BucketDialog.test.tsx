import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BucketDialog } from './BucketDialog';

const addBucket = vi.hoisted(() => vi.fn());
const changeBucket = vi.hoisted(() => vi.fn());
const testBucket = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/admin/fetchBuckets', () => ({
  addBucket,
  changeBucket,
  testBucket,
  fetchBuckets: vi.fn(),
  removeBucket: vi.fn(),
}));

const fillIn = async () => {
  await userEvent.type(screen.getByLabelText(/^Name/u), 'Films');
  await userEvent.type(screen.getByLabelText(/^Bucket/u), 'media');
  await userEvent.type(screen.getByLabelText(/^Access key ID/u), 'key');
  await userEvent.type(screen.getByLabelText(/^Secret access key/u), 'secret');
};

beforeEach(() => {
  addBucket.mockReset().mockResolvedValue(null);
  changeBucket.mockReset().mockResolvedValue(null);
  testBucket.mockReset().mockResolvedValue({ kind: 'reached', folders: ['Films', 'Shows'] });
});

describe('BucketDialog', () => {
  it('will not add a bucket until it has a name, a bucket and a key', () => {
    render(<BucketDialog isOpen bucket={null} onClose={vi.fn()} onSaved={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
  });

  it('adds the bucket as typed', async () => {
    const onSaved = vi.fn();

    render(<BucketDialog isOpen bucket={null} onClose={vi.fn()} onSaved={onSaved} />);

    await fillIn();
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledOnce();
    });
    expect(addBucket).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Films', bucket: 'media', secretAccessKey: 'secret' }),
    );
  });

  it('says what it found at the top of the bucket when tried', async () => {
    render(<BucketDialog isOpen bucket={null} onClose={vi.fn()} onSaved={vi.fn()} />);

    await fillIn();
    await userEvent.click(screen.getByRole('button', { name: /test/iu }));

    expect(await screen.findByText(/Films, Shows/u)).toBeInTheDocument();
  });
});
