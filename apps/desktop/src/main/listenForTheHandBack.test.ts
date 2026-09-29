import { get } from 'node:http';
import { describe, expect, it } from 'vitest';
import { listenForTheHandBack } from './listenForTheHandBack';

/**
 * Asks the loopback port for a path, as the browser would once the page sends it there.
 *
 * @param port - Where the app is listening.
 * @param path - What the browser was sent to.
 * @returns What it answered with.
 */
const visit = async (port: number, path: string): Promise<{ status: number; body: string }> =>
  await new Promise((resolve, reject) => {
    get({ host: '127.0.0.1', port, path }, (response) => {
      let body = '';

      response.setEncoding('utf8');
      response.on('data', (chunk: string) => {
        body += chunk;
      });
      response.on('end', () => {
        resolve({ status: response.statusCode ?? 0, body });
      });
    }).on('error', reject);
  });

describe('listenForTheHandBack', () => {
  it('takes the code the browser brings back, and tells the browser it is done', async () => {
    const { port, handedBack } = await listenForTheHandBack();
    const answered = await visit(port, '/signed-in?code=abc');

    expect(answered.status).toBe(200);
    expect(answered.body).toContain('go back to Valence');
    await expect(handedBack).resolves.toBe('abc');
  });

  it('answers nothing else, and keeps waiting', async () => {
    const { port, handedBack } = await listenForTheHandBack();

    expect((await visit(port, '/somewhere-else')).status).toBe(404);
    expect((await visit(port, '/signed-in')).status).toBe(404);

    await visit(port, '/signed-in?code=abc');

    await expect(handedBack).resolves.toBe('abc');
  });

  it('gives up on a browser that never comes back', async () => {
    const { handedBack } = await listenForTheHandBack(10);

    await expect(handedBack).resolves.toBeNull();
  });

  it('gives up on the one before when asked again', async () => {
    const before = await listenForTheHandBack();
    const after = await listenForTheHandBack();

    await expect(before.handedBack).resolves.toBeNull();

    await visit(after.port, '/signed-in?code=abc');

    await expect(after.handedBack).resolves.toBe('abc');
  });
});
