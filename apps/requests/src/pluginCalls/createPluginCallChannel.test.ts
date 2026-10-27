import { describe, expect, it, vi } from 'vitest';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { DownloadClientFailure } from '@ValenceRequests/downloads/DownloadClientFailure';
import type { PluginCall } from '@ValenceContracts/schemas/PluginCall';
import { createPluginCallChannel } from './createPluginCallChannel';

const problemOf = async (promise: Promise<object>): Promise<string> => {
  try {
    await promise;

    return 'none';
  } catch (error) {
    return error instanceof DownloadClientFailure
      ? (error.said.code ?? error.said.message)
      : 'other';
  }
};

describe('the channel to plugins in the Valence server', () => {
  it('fails a call at once while no server is listening', async () => {
    const channel = createPluginCallChannel();

    expect(await problemOf(channel.call('p', 'c', 'test', {}))).toBe(
      'requests.pluginCalls.valenceIsNotConnectedSoThe',
    );
  });

  it('sends a call to the server and resolves with the answer it posts back', async () => {
    const channel = createPluginCallChannel();
    const heard: PluginCall[] = [];

    channel.listen((call) => heard.push(call));

    const calling = channel.call('example-files', 'files', 'add', { title: 'x' });
    const [call] = heard;

    expect(call).toMatchObject({ pluginId: 'example-files', clientId: 'files', method: 'add' });
    expect(
      channel.answer(call?.id ?? '', { ok: true, value: { id: '7' }, linkHosts: ['*.x.example'] }),
    ).toBe(true);
    expect(await calling).toEqual({ value: { id: '7' }, linkHosts: ['*.x.example'] });
    expect(channel.answer(call?.id ?? '', { ok: true, value: null, linkHosts: [] })).toBe(false);
  });

  it('fails a call with what the server said went wrong', async () => {
    const channel = createPluginCallChannel();

    channel.listen((call) => {
      channel.answer(call.id, { ok: false, problem: sayVerbatim('The service is down.') });
    });

    expect(await problemOf(channel.call('p', 'c', 'test', {}))).toBe('The service is down.');
  });

  it('gives up on a call nobody answers, and stops sending to a server that has gone', async () => {
    vi.useFakeTimers();

    const channel = createPluginCallChannel({ patienceMs: 1000 });
    const stop = channel.listen(() => undefined);
    const calling = problemOf(channel.call('p', 'c', 'status', { ids: [] }));

    await vi.advanceTimersByTimeAsync(1000);
    expect(await calling).toBe('requests.pluginCalls.thePluginDidNotAnswerIn');

    stop();
    expect(await problemOf(channel.call('p', 'c', 'test', {}))).toBe(
      'requests.pluginCalls.valenceIsNotConnectedSoThe',
    );
    vi.useRealTimers();
  });
});
