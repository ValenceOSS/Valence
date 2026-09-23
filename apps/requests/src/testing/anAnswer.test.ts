import { describe, expect, it } from 'vitest';
import { bytesOf } from '@ValenceRequests/solver/bytesOf';
import { anAnswer } from './anAnswer';

describe('anAnswer', () => {
  it('holds the body as a data URL', () => {
    const answer = anAnswer({ body: 'hello', status: 404 });

    expect(bytesOf(answer.dataUrl).toString()).toBe('hello');
    expect(answer.status).toBe(404);
  });
});
