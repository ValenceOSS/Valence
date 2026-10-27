import { z } from 'zod';
import { SaidError } from '@ValenceI18n/SaidError';
import { saying } from '@ValenceI18n/saying';
import { isHostAllowed } from '@ValenceCore/network/isHostAllowed';
import { AddAnswerSchema } from '@ValenceSDK/downloadClients/AddAnswerSchema';
import type { AddAnswer } from '@ValenceSDK/downloadClients/AddAnswerSchema';
import type { DownloadAsk } from '@ValenceSDK/downloadClients/DownloadAskSchema';
import { FilesAnswerSchema } from '@ValenceSDK/downloadClients/FilesAnswerSchema';
import type { FilesAnswer } from '@ValenceSDK/downloadClients/FilesAnswerSchema';
import type { ReleaseIn } from '@ValenceSDK/downloadClients/ReleaseInSchema';
import { StatusAnswerSchema } from '@ValenceSDK/downloadClients/StatusAnswerSchema';
import type { StatusAnswer } from '@ValenceSDK/downloadClients/StatusAnswerSchema';
import type { StatusAsk } from '@ValenceSDK/downloadClients/StatusAskSchema';
import { TestAnswerSchema } from '@ValenceSDK/downloadClients/TestAnswerSchema';
import type { TestAnswer } from '@ValenceSDK/downloadClients/TestAnswerSchema';
import { ResolveAnswerSchema } from '@ValenceSDK/sources/ResolveAnswerSchema';
import type { ResolveAnswer } from '@ValenceSDK/sources/ResolveAnswerSchema';
import type { ResolveAsk } from '@ValenceSDK/sources/ResolveAskSchema';
import { StreamsAnswerSchema } from '@ValenceSDK/sources/StreamsAnswerSchema';
import type { StreamsAnswer } from '@ValenceSDK/sources/StreamsAnswerSchema';
import type { StreamsAsk } from '@ValenceSDK/sources/StreamsAskSchema';
import type { SandboxHandler } from '@ValenceServer/plugins/sandbox/SandboxProtocol';
import type { InstalledRecord } from '@ValenceServer/plugins/store/PluginStore';

type Runnable = { record: InstalledRecord; code: string };

const NOTHING = z.null();

type CreateContributionCallsOptions = {
  runnable: (pluginId: string) => Promise<Runnable | null>;
  invoke: (plugin: Runnable, handler: SandboxHandler, args: object) => Promise<string>;
};

type PluginDownloadClient = {
  test: () => Promise<TestAnswer>;
  add: (release: ReleaseIn) => Promise<AddAnswer>;
  status: (ask: StatusAsk) => Promise<StatusAnswer>;
  files: (ask: DownloadAsk) => Promise<FilesAnswer>;
  remove: (ask: DownloadAsk) => Promise<void>;
};

type PluginSource = {
  streams: (ask: StreamsAsk) => Promise<StreamsAnswer>;
  resolve: (ask: ResolveAsk) => Promise<ResolveAnswer>;
};

type ContributionCalls = {
  downloadClient: (pluginId: string, clientId: string) => PluginDownloadClient;
  source: (pluginId: string, sourceId: string) => PluginSource;
  linkHostsOf: (pluginId: string) => Promise<string[]>;
};

/**
 * The hosts a plugin listed for the files it hands over.
 *
 * @param record - The installed plugin.
 * @returns The hosts, `*.` patterns among them.
 */
const linkHostsIn = (record: InstalledRecord): string[] =>
  record.manifest.permissions.flatMap((permission) =>
    permission.kind === 'links' ? permission.hosts : [],
  );

/**
 * How the server asks an installed plugin's download client or source to do something: only of a
 * plugin that is turned on and declares that contribution, and only accepting an answer that reads
 * as the SDK says it should and whose links all go to hosts the plugin listed and an administrator
 * accepted. Anything else is a problem in words naming the plugin, never the plugin's raw answer.
 *
 * @param options - How to find a plugin that can run, and how to run one of its handlers.
 * @returns The calls.
 */
const createContributionCalls = ({
  runnable,
  invoke,
}: CreateContributionCallsOptions): ContributionCalls => {
  const call = async <T>(
    pluginId: string,
    kind: 'downloadClient' | 'source',
    id: string,
    handler: SandboxHandler,
    ask: object,
    schema: z.ZodType<T>,
  ): Promise<{ value: T; record: InstalledRecord }> => {
    const found = await runnable(pluginId);

    if (found === null) {
      throw new SaidError(
        saying('server.service.contributionCalls.namePluginIsOffOrGone', { name: pluginId }),
      );
    }

    const { record } = found;
    const declared =
      kind === 'source'
        ? record.manifest.contributes.sources
        : record.manifest.contributes.downloadClients;

    if (!declared.some((each) => each.id === id)) {
      throw new SaidError(
        saying('server.service.contributionCalls.nameOffersNothingCalledId', {
          name: record.manifest.name,
          id,
        }),
      );
    }

    let answer: string;

    try {
      answer = await invoke(found, handler, { id, ask });
    } catch (error) {
      throw error instanceof SaidError
        ? error
        : new SaidError(
            saying('server.service.pluginService.nameIsNotAnswering', {
              name: record.manifest.name,
            }),
          );
    }

    const read = schema.safeParse(JSON.parse(answer));

    if (!read.success) {
      throw new SaidError(
        saying('server.service.contributionCalls.nameAnsweredSomethingValenceCouldNot', {
          name: record.manifest.name,
        }),
      );
    }

    return { value: read.data, record };
  };

  const holdToLinks = (record: InstalledRecord, urls: readonly string[]): void => {
    const hosts = linkHostsIn(record);
    const stray = urls
      .map((url) => new URL(url).hostname)
      .find((host) => !isHostAllowed(host, hosts));

    if (stray !== undefined) {
      throw new SaidError(
        saying('server.service.contributionCalls.nameSentALinkToHost', {
          name: record.manifest.name,
          host: stray,
        }),
      );
    }
  };

  return {
    downloadClient: (pluginId, clientId) => ({
      test: async () =>
        (
          await call(
            pluginId,
            'downloadClient',
            clientId,
            'downloadClient.test',
            {},
            TestAnswerSchema,
          )
        ).value,
      add: async (release) =>
        (
          await call(
            pluginId,
            'downloadClient',
            clientId,
            'downloadClient.add',
            release,
            AddAnswerSchema,
          )
        ).value,
      status: async (ask) =>
        (
          await call(
            pluginId,
            'downloadClient',
            clientId,
            'downloadClient.status',
            ask,
            StatusAnswerSchema,
          )
        ).value,
      files: async (ask) => {
        const { value, record } = await call(
          pluginId,
          'downloadClient',
          clientId,
          'downloadClient.files',
          ask,
          FilesAnswerSchema,
        );

        if ('files' in value) {
          holdToLinks(
            record,
            value.files.map((file) => file.url),
          );
        }

        return value;
      },
      remove: async (ask) => {
        await call(pluginId, 'downloadClient', clientId, 'downloadClient.remove', ask, NOTHING);
      },
    }),
    source: (pluginId, sourceId) => ({
      streams: async (ask) =>
        (await call(pluginId, 'source', sourceId, 'source.streams', ask, StreamsAnswerSchema))
          .value,
      resolve: async (ask) => {
        const { value, record } = await call(
          pluginId,
          'source',
          sourceId,
          'source.resolve',
          ask,
          ResolveAnswerSchema,
        );

        if (value.kind === 'ready') {
          holdToLinks(record, [value.url]);
        }

        return value;
      },
    }),
    linkHostsOf: async (pluginId) => {
      const found = await runnable(pluginId);

      return found === null ? [] : linkHostsIn(found.record);
    },
  };
};

export type { ContributionCalls, PluginDownloadClient, PluginSource };

export { createContributionCalls };
