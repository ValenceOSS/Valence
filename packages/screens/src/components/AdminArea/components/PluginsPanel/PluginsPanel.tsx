import { sayAgainIfAny } from '@ValenceI18n/sayAgainIfAny';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload as UploadIcon } from '@keyline-icons/react';
import { Callout } from '@ValenceUI/Callout';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { FilePicker } from '@ValenceUI/FilePicker';
import { Icon } from '@ValenceUI/Icon';
import { Spinner } from '@ValenceUI/Spinner';
import { changePlugin } from '@ValenceClient/plugins/changePlugin';
import { previewCataloguePlugin } from '@ValenceClient/plugins/previewCataloguePlugin';
import { removePlugin } from '@ValenceClient/plugins/removePlugin';
import { uploadPluginPackage } from '@ValenceClient/plugins/uploadPluginPackage';
import { pluginQueries } from '@ValenceClient/query/pluginQueries';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { CatalogueEntryRow } from '@ValenceScreens/components/AdminArea/components/PluginsPanel/components/CatalogueEntryRow/CatalogueEntryRow';
import { InstallReviewDialog } from '@ValenceScreens/components/AdminArea/components/PluginsPanel/components/InstallReviewDialog/InstallReviewDialog';
import { InstalledPluginCard } from '@ValenceScreens/components/AdminArea/components/PluginsPanel/components/InstalledPluginCard/InstalledPluginCard';
import { rollbackPlugin } from '@ValenceClient/plugins/rollbackPlugin';
import { usePluginWithdrawn } from '@ValenceClient/plugins/usePluginWithdrawn';
import { PluginPageDialog } from '@ValenceScreens/components/AdminArea/components/PluginsPanel/components/PluginPageDialog/PluginPageDialog';
import { RemovePluginDialog } from '@ValenceScreens/components/AdminArea/components/PluginsPanel/components/RemovePluginDialog/RemovePluginDialog';
import { PluginSettingsDialog } from '@ValenceScreens/components/AdminArea/components/PluginsPanel/components/PluginSettingsDialog/PluginSettingsDialog';
import type { InstallPreview, InstalledPlugin } from '@ValenceContracts/schemas/Plugin';
import { say } from '@ValenceI18n/say';

/**
 * Everything about the plugins on this server: the ones installed and how they are getting on, the
 * official ones Valence can vouch for, and a way to install one from a file. Nothing is installed
 * without the review first, which lists what it would be allowed to do.
 */
const PluginsPanel = () => {
  const cache = useQueryClient();
  const installed = useQuery(pluginQueries.installed());
  const catalogue = useQuery(pluginQueries.catalogue());
  const [preview, setPreview] = useState<InstallPreview | null>(null);
  const [fetching, setFetching] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [settingsOf, setSettingsOf] = useState<InstalledPlugin | null>(null);
  const [removing, setRemoving] = useState<InstalledPlugin | null>(null);
  const [rollingBack, setRollingBack] = useState<InstalledPlugin | null>(null);
  const [page, setPage] = useState<{ pluginId: string; pageId: string; title: string } | null>(
    null,
  );
  const [isUploading, setIsUploading] = useState(false);

  usePluginWithdrawn(page?.pluginId ?? null, () => {
    setPage(null);
  });

  const reread = async () => {
    await cache.invalidateQueries({ queryKey: pluginQueries.key });
  };

  const toggle = (plugin: InstalledPlugin, onDone?: () => void) => {
    setBusy(plugin.id);

    void changePlugin(plugin.id, { isEnabled: !plugin.isEnabled })
      .then(() => {
        tellOutcome(
          plugin.isEnabled
            ? say('screens.adminArea.pluginsPanel.turnedNameOff', { name: plugin.name })
            : say('screens.adminArea.pluginsPanel.turnedNameOn', { name: plugin.name }),
          null,
        );
      })
      .catch((problem: Error) => {
        tellOutcome('', problem.message);
      })
      .finally(() => {
        setBusy(null);
        onDone?.();
        void reread();
      });
  };

  const look = (pluginId: string) => {
    setFetching(pluginId);

    void previewCataloguePlugin(pluginId)
      .then(setPreview)
      .catch((problem: Error) => {
        tellOutcome('', problem.message);
      })
      .finally(() => {
        setFetching(null);
      });
  };

  return (
    <div className="flex flex-col gap-4">
      <PanelCard
        title={say('screens.adminArea.pluginsPanel.installedPlugins')}
        isFlush
        actions={
          <FilePicker
            label={say('screens.adminArea.pluginsPanel.installFromAFile')}
            accept=".vplugin,.sig"
            size="sm"
            variant="secondary"
            isLoading={isUploading}
            onPickMany={(files) => {
              const plugin = files.find((file) => file.name.endsWith('.vplugin')) ?? null;
              const signature = files.find((file) => file.name.endsWith('.sig')) ?? null;

              if (plugin === null) {
                tellOutcome('', say('screens.adminArea.pluginsPanel.chooseAVpluginFileAndIts'));

                return;
              }

              setIsUploading(true);

              void uploadPluginPackage(plugin, signature)
                .then(setPreview)
                .catch((problem: Error) => {
                  tellOutcome('', problem.message);
                })
                .finally(() => {
                  setIsUploading(false);
                });
            }}
          >
            <Icon of={UploadIcon} size={14} />
            {say('screens.adminArea.pluginsPanel.installFromAFile')}
          </FilePicker>
        }
      >
        {installed.isError ? (
          <CouldNotRead
            said={say('screens.adminArea.pluginsPanel.thePluginsCouldNotBeRead')}
            isTryingAgain={installed.isFetching}
            onTryAgain={() => {
              void installed.refetch();
            }}
          />
        ) : installed.isPending ? (
          <Spinner
            isCentered
            size="sm"
            label={say('screens.adminArea.pluginsPanel.readingThePlugins')}
          />
        ) : installed.data.plugins.length === 0 ? (
          <p className="px-4 py-6 text-sm text-text-muted">
            {say('screens.adminArea.pluginsPanel.noPluginsYetPluginsRunIn')}
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border/50">
            {installed.data.plugins.map((plugin) => (
              <InstalledPluginCard
                key={plugin.id}
                plugin={plugin}
                isBusy={busy === plugin.id || fetching === plugin.id}
                onToggle={() => {
                  toggle(plugin);
                }}
                onSettings={() => {
                  setSettingsOf(plugin);
                }}
                onUpdate={() => {
                  look(plugin.id);
                }}
                onRollback={() => {
                  setRollingBack(plugin);
                }}
                onRemove={() => {
                  setRemoving(plugin);
                }}
                onOpenPage={(opened) => {
                  setPage({ pluginId: plugin.id, ...opened });
                }}
              />
            ))}
          </ul>
        )}
      </PanelCard>

      <PanelCard title={say('screens.adminArea.pluginsPanel.officialPlugins')} isFlush>
        {catalogue.isError ? (
          <CouldNotRead
            said={say('common.theCatalogueCouldNotBeRead')}
            isTryingAgain={catalogue.isFetching}
            onTryAgain={() => {
              void catalogue.refetch();
            }}
          />
        ) : catalogue.isPending ? (
          <Spinner isCentered size="sm" label={say('common.readingTheCatalogue')} />
        ) : !catalogue.data.isReachable ? (
          <Callout
            title={say('screens.adminArea.pluginsPanel.officialPluginsAreUnavailable')}
            tone="warning"
            className="m-4"
          >
            {say('screens.adminArea.pluginsPanel.problemPluginsAlreadyInstalledKeepWorking', {
              problem:
                sayAgainIfAny(catalogue.data.problem) ?? say('common.thePluginCatalogueCouldNotBe'),
            })}
          </Callout>
        ) : catalogue.data.plugins.length === 0 ? (
          <p className="px-4 py-6 text-sm text-text-muted">
            {say('screens.adminArea.pluginsPanel.theCatalogueHasNoPluginsYet')}
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border/50">
            {catalogue.data.plugins.map((entry) => (
              <CatalogueEntryRow
                key={entry.id}
                entry={entry}
                isBusy={fetching === entry.id}
                onInstall={() => {
                  look(entry.id);
                }}
              />
            ))}
          </ul>
        )}
      </PanelCard>

      <InstallReviewDialog
        preview={preview}
        onClose={() => {
          setPreview(null);
        }}
        onInstalled={() => {
          setPreview(null);
          void reread();
        }}
      />

      <PluginSettingsDialog
        plugin={settingsOf}
        redirectUri={installed.data?.redirectUri ?? null}
        onClose={() => {
          setSettingsOf(null);
        }}
        onSaved={() => {
          setSettingsOf(null);
          void reread();
        }}
      />

      <PluginPageDialog
        page={page}
        onClose={() => {
          setPage(null);
        }}
      />

      <ConfirmDialog
        title={
          rollingBack === null
            ? say('screens.adminArea.pluginsPanel.rollBackThisPlugin')
            : say('screens.adminArea.pluginsPanel.rollBackName', { name: rollingBack.name })
        }
        detail={
          rollingBack === null || rollingBack.previousVersion === null
            ? say('screens.adminArea.pluginsPanel.theEarlierVersionComesBackWithWhat')
            : say('screens.adminArea.pluginsPanel.versionComesBackWithWhat', {
                version: rollingBack.previousVersion,
              })
        }
        confirmLabel={say('screens.adminArea.pluginsPanel.rollBack')}
        isBusy={rollingBack !== null && busy === rollingBack.id}
        isOpen={rollingBack !== null}
        onClose={() => {
          setRollingBack(null);
        }}
        onConfirm={() => {
          const plugin = rollingBack;

          if (plugin === null) {
            return;
          }

          setBusy(plugin.id);

          void rollbackPlugin(plugin.id)
            .then((back) => {
              tellOutcome(
                say('screens.adminArea.pluginsPanel.rolledNameBackToVersion', {
                  name: plugin.name,
                  version: back.version,
                }),
                null,
              );
            })
            .catch((problem: Error) => {
              tellOutcome('', problem.message);
            })
            .finally(() => {
              setBusy(null);
              setRollingBack(null);
              void reread();
            });
        }}
      />

      <RemovePluginDialog
        plugin={removing}
        isBusy={removing !== null && busy === removing.id}
        onClose={() => {
          setRemoving(null);
        }}
        onTurnOff={() => {
          if (removing !== null) {
            toggle(removing, () => {
              setRemoving(null);
            });
          }
        }}
        onConfirm={() => {
          const plugin = removing;

          if (plugin === null) {
            return;
          }

          setBusy(plugin.id);

          void removePlugin(plugin.id)
            .then(() => {
              tellOutcome(say('common.removedName', { name: plugin.name }), null);
            })
            .catch((problem: Error) => {
              tellOutcome('', problem.message);
            })
            .finally(() => {
              setBusy(null);
              setRemoving(null);
              void reread();
            });
        }}
      />
    </div>
  );
};

PluginsPanel.displayName = 'PluginsPanel';

export { PluginsPanel };
