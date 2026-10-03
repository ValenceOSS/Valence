import { describe, expect, it } from 'vitest';
import { SESSION_MESSAGE_MAX_LENGTH } from '@ValenceContracts/schemas/SessionMessage';
import { SessionMessageFormSchema } from './SessionMessageFormSchema';

describe('SessionMessageFormSchema', () => {
  it('takes a message, trimmed', () => {
    expect(SessionMessageFormSchema.parse({ text: ' Tea is ready ' })).toEqual({
      text: 'Tea is ready',
    });
  });

  it('will not send nothing, or only spaces', () => {
    expect(SessionMessageFormSchema.safeParse({ text: '   ' }).success).toBe(false);
  });

  it('refuses one too long for the banner rather than cutting it', () => {
    expect(
      SessionMessageFormSchema.safeParse({ text: 'a'.repeat(SESSION_MESSAGE_MAX_LENGTH + 1) })
        .success,
    ).toBe(false);
  });
});
