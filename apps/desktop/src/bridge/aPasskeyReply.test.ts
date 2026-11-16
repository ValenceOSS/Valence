import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { aPasskeyReply } from './aPasskeyReply';

const ReplySchema = aPasskeyReply(z.string());

describe('aPasskeyReply', () => {
  it('reads what came of it', () => {
    expect(ReplySchema.parse({ kind: 'done', done: 'code' })).toEqual({
      kind: 'done',
      done: 'code',
    });
  });

  it('reads a cancellation and a failure', () => {
    expect(ReplySchema.parse({ kind: 'cancelled' })).toEqual({ kind: 'cancelled' });
    expect(ReplySchema.parse({ kind: 'failed', reason: 'No.' })).toEqual({
      kind: 'failed',
      reason: 'No.',
    });
  });

  it('refuses what came of it in the wrong shape', () => {
    expect(ReplySchema.safeParse({ kind: 'done', done: 1 }).success).toBe(false);
  });
});
