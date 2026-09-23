import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { withDangerousMod, withEntitlementsPlist, withXcodeProject } from 'expo/config-plugins.js';
import type { ConfigPlugin } from 'expo/config-plugins.js';

const TARGET = 'TopShelf';

const GROUP = 'group.app.valence.tv';

const SOURCES = join(dirname(fileURLToPath(import.meta.url)), '..', 'targets', 'top-shelf');

const FILES = ['ContentProvider.swift', 'Info.plist', `${TARGET}.entitlements`] as const;

/**
 * Adds the Top Shelf extension: what the television shows above Valence when it sits in the top
 * row of the Home screen — a row of what has just arrived. The extension's own files live in
 * `targets/top-shelf` and are copied into the generated project; the app and the extension share a
 * container, which the app writes the shelf's titles and pictures into and the extension reads.
 *
 * It does nothing a second time where the project already has the extension, so running prebuild
 * without cleaning does not add it twice.
 *
 * @param config - The app's Expo config.
 * @returns The config, with the extension added.
 */
const withTopShelf: ConfigPlugin = (config) => {
  const grouped = withEntitlementsPlist(config, (asked) => {
    asked.modResults['com.apple.security.application-groups'] = [GROUP];

    return asked;
  });

  const copied = withDangerousMod(grouped, [
    'ios',
    (asked) => {
      const into = join(asked.modRequest.platformProjectRoot, TARGET);

      mkdirSync(into, { recursive: true });

      for (const file of FILES) {
        copyFileSync(join(SOURCES, file), join(into, file));
      }

      return Promise.resolve(asked);
    },
  ]);

  return withXcodeProject(copied, (asked) => {
    const project = asked.modResults;

    if (project.pbxTargetByName(TARGET) !== null) {
      return asked;
    }

    const bundleId = `${asked.ios?.bundleIdentifier ?? 'app.valence.tv'}.topshelf`;
    const target = project.addTarget(TARGET, 'app_extension', TARGET, bundleId);
    const group = project.addPbxGroup([...FILES], TARGET, TARGET);
    const root = project.getFirstProject().firstProject.mainGroup;

    project.addToPbxGroup(group.uuid, root);
    project.addBuildPhase(
      ['ContentProvider.swift'],
      'PBXSourcesBuildPhase',
      'Sources',
      target.uuid,
    );
    project.addBuildPhase(
      ['TVServices.framework'],
      'PBXFrameworksBuildPhase',
      'Frameworks',
      target.uuid,
    );
    project.addBuildPhase([], 'PBXResourcesBuildPhase', 'Resources', target.uuid);

    const configurations = project.pbxXCBuildConfigurationSection();

    for (const key of Object.keys(configurations)) {
      const entry = configurations[key];

      if (entry === undefined || typeof entry === 'string') {
        continue;
      }

      const settings = entry.buildSettings;

      if (settings.PRODUCT_NAME !== `"${TARGET}"`) {
        continue;
      }

      Object.assign(settings, {
        SDKROOT: 'appletvos',
        SUPPORTED_PLATFORMS: '"appletvos appletvsimulator"',
        TARGETED_DEVICE_FAMILY: '3',
        TVOS_DEPLOYMENT_TARGET: '16.4',
        SWIFT_VERSION: '5.0',
        INFOPLIST_FILE: `${TARGET}/Info.plist`,
        CODE_SIGN_ENTITLEMENTS: `${TARGET}/${TARGET}.entitlements`,
        GENERATE_INFOPLIST_FILE: 'NO',
        MARKETING_VERSION: asked.version ?? '1.0',
        CURRENT_PROJECT_VERSION: '1',
        CLANG_ENABLE_MODULES: 'YES',
      });
    }

    return asked;
  });
};

export { withTopShelf };
