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
import { PluginPageDialog } from '@ValenceScreens/components/AdminArea/components/PluginsPanel/components/PluginPageDialog/PluginPageDialog';
import { PluginSettingsDialog } from '@ValenceScreens/components/AdminArea/components/PluginsPanel/components/PluginSettingsDialog/PluginSettingsDialog';
import type { InstallPreview, InstalledPlugin } from '@ValenceContracts/schemas/Plugin';

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
  const [page, setPage] = useState<{ pluginId: string; pageId: string; title: string } | null>(
    null,
  );
  const [isUploading, setIsUploading] = useState(false);

  const reread = async () => {
    await cache.invalidateQueries({ queryKey: pluginQueries.key });
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
        title="Installed plugins"
        isFlush
        actions={
          <FilePicker
            label="Install from a file"
            accept=".vplugin,.sig"
            size="sm"
            variant="secondary"
            isLoading={isUploading}
            onPickMany={(files) => {
              const plugin = files.find((file) => file.name.endsWith('.vplugin')) ?? null;
              const signature = files.find((file) => file.name.endsWith('.sig')) ?? null;

              if (plugin === null) {
                tellOutcome(
                  '',
                  'Choose a .vplugin file, and its .sig file with it where it has one.',
                );

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
            Install from a file
          </FilePicker>
        }
      >
        {installed.isError ? (
          <CouldNotRead
            what="The plugins"
            isTryingAgain={installed.isFetching}
            onTryAgain={() => {
              void installed.refetch();
            }}
          />
        ) : installed.isPending ? (
          <Spinner isCentered size="sm" label="Reading the plugins" />
        ) : installed.data.plugins.length === 0 ? (
          <p className="px-4 py-6 text-sm text-text-muted">
            No plugins yet. Plugins run in a sandbox on this server and can only do what you allow
            when you install them.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border/50">
            {installed.data.plugins.map((plugin) => (
              <InstalledPluginCard
                key={plugin.id}
                plugin={plugin}
                isBusy={busy === plugin.id || fetching === plugin.id}
                onToggle={() => {
                  setBusy(plugin.id);

                  void changePlugin(plugin.id, { isEnabled: !plugin.isEnabled })
                    .then(() => {
                      tellOutcome(
                        plugin.isEnabled
                          ? `Turned ${plugin.name} off.`
                          : `Turned ${plugin.name} on.`,
                        null,
                      );
                    })
                    .catch((problem: Error) => {
                      tellOutcome('', problem.message);
                    })
                    .finally(() => {
                      setBusy(null);
                      void reread();
                    });
                }}
                onSettings={() => {
                  setSettingsOf(plugin);
                }}
                onUpdate={() => {
                  look(plugin.id);
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

      <PanelCard title="Official plugins" isFlush>
        {catalogue.isError ? (
          <CouldNotRead
            what="The catalogue"
            isTryingAgain={catalogue.isFetching}
            onTryAgain={() => {
              void catalogue.refetch();
            }}
          />
        ) : catalogue.isPending ? (
          <Spinner isCentered size="sm" label="Reading the catalogue" />
        ) : !catalogue.data.isReachable ? (
          <Callout title="Official plugins are unavailable" tone="warning" className="m-4">
            {`${catalogue.data.problem ?? 'The plugin catalogue could not be reached.'} Plugins already installed keep working.`}
          </Callout>
        ) : catalogue.data.plugins.length === 0 ? (
          <p className="px-4 py-6 text-sm text-text-muted">The catalogue has no plugins yet.</p>
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
        title={removing === null ? 'Remove this plugin?' : `Remove ${removing.name}?`}
        detail="It stops at once, and everything it kept and every account connected to it is forgotten. Themes it added go back to Valence’s own colours."
        confirmLabel="Remove it"
        isDestructive
        isBusy={removing !== null && busy === removing.id}
        isOpen={removing !== null}
        onClose={() => {
          setRemoving(null);
        }}
        onConfirm={() => {
          const plugin = removing;

          if (plugin === null) {
            return;
          }

          setBusy(plugin.id);

          void removePlugin(plugin.id)
            .then(() => {
              tellOutcome(`Removed ${plugin.name}.`, null);
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
