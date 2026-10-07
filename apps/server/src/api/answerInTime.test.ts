import { describe, expect, it } from 'vitest';
import { answerInTime } from '@ValenceServer/api/answerInTime';

describe('answerInTime', () => {
  it('answers with what the work says where it says it in time', async () => {
    await expect(answerInTime(Promise.resolve('ready'), 'late', 50)).resolves.toBe('ready');
  });

  it('answers with the stand-in where the work is still going at the deadline', async () => {
    const never = new Promise<string>(() => undefined);

    await expect(answerInTime(never, 'late', 20)).resolves.toBe('late');
  });

  it('answers with the stand-in where the work fails', async () => {
    await expect(answerInTime(Promise.reject(new Error('down')), 'late', 50)).resolves.toBe('late');
  });
});
