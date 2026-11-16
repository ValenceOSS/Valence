import { afterEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { HandBackReplySchema } from './HandBackReply';
import { askAboutAPasskey } from './askAboutAPasskey';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));

const UNANSWERED = { kind: 'failed', reason: 'The app didn’t respond to the passkey request.' };

afterEach(() => {
  vi.mocked(invoke).mockReset();
});

describe('askAboutAPasskey', () => {
  it('asks the host and hands back what it answered', async () => {
    vi.mocked(invoke).mockResolvedValue({ kind: 'done', done: 'code' });

    await expect(
      askAboutAPasskey('passkeys_sign_in_on_a_page', { challenge: 'c' }, HandBackReplySchema),
    ).resolves.toEqual({ kind: 'done', done: 'code' });
    expect(invoke).toHaveBeenCalledWith('passkeys_sign_in_on_a_page', { challenge: 'c' });
  });

  it('says the app did not answer where the host never did', async () => {
    vi.mocked(invoke).mockRejectedValue(new Error('no such command'));

    await expect(
      askAboutAPasskey('passkeys_sign_in_on_a_page', {}, HandBackReplySchema),
    ).resolves.toEqual(UNANSWERED);
  });

  it('says the app did not answer where what came back makes no sense', async () => {
    vi.mocked(invoke).mockResolvedValue({ kind: 'done', done: '' });

    await expect(
      askAboutAPasskey('passkeys_sign_in_on_a_page', {}, HandBackReplySchema),
    ).resolves.toEqual(UNANSWERED);
  });
});
