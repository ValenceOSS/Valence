import { SaidError } from '@ValenceI18n/SaidError';
import { saying } from '@ValenceI18n/saying';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { PluginCall, PluginCallAnswer } from '@ValenceContracts/schemas/PluginCall';
import { DownloadAskSchema } from '@ValenceSDK/downloadClients/DownloadAskSchema';
import { ReleaseInSchema } from '@ValenceSDK/downloadClients/ReleaseInSchema';
import { StatusAskSchema } from '@ValenceSDK/downloadClients/StatusAskSchema';
import type { ContributionCalls } from '@ValenceServer/plugins/service/createContributionCalls';

/**
 * Answers a call the requests service made to a plugin's download client: asks the plugin, and
 * says which hosts its links may come from so the files can be fetched from nowhere else. Anything
 * that goes wrong is an answer too, in words, since the requests service is waiting on it.
 *
 * @param call - What the requests service asked.
 * @param plugins - How a plugin's download client is asked.
 * @returns The answer to post back.
 */
const answerPluginCall = async (
  call: PluginCall,
  plugins: Pick<ContributionCalls, 'downloadClient' | 'linkHostsOf'>,
): Promise<PluginCallAnswer> => {
  try {
    const client = plugins.downloadClient(call.pluginId, call.clientId);
    let value: JsonValue = null;

    switch (call.method) {
      case 'test':
        value = await client.test();
        break;
      case 'add':
        value = await client.add(ReleaseInSchema.parse(call.ask));
        break;
      case 'status':
        value = await client.status(StatusAskSchema.parse(call.ask));
        break;
      case 'files':
        value = await client.files(DownloadAskSchema.parse(call.ask));
        break;
      case 'remove':
        await client.remove(DownloadAskSchema.parse(call.ask));
        break;
    }

    return { ok: true, value, linkHosts: await plugins.linkHostsOf(call.pluginId) };
  } catch (error) {
    return {
      ok: false,
      problem: error instanceof SaidError ? error.said : saying('common.theClientCouldNotBeAsked'),
    };
  }
};

export { answerPluginCall };
