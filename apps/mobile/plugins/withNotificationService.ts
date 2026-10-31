import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { withEntitlementsPlist, withInfoPlist, withXcodeProject } from 'expo/config-plugins';
import type { ConfigPlugin } from 'expo/config-plugins';

const TARGET = 'NotificationService';

const SHARED_KEYCHAIN = '$(AppIdentifierPrefix)app.valence.shared';

const THE_APPS_OWN_KEYCHAIN = '$(AppIdentifierPrefix)app.valence.ios';

const SOURCES = join(import.meta.dirname, '..', 'modules', 'notificationService', 'ios');

const SWIFT = [
  {
    name: 'NotificationService.swift',
    from: join(SOURCES, 'extension', 'NotificationService.swift'),
  },
  { name: 'SharedSignIn.swift', from: join(SOURCES, 'shared', 'SharedSignIn.swift') },
];

/**
 * The extension's `Info.plist`: what kind of extension it is, its class, the keychain group it
 * reads the sign-in from, and the app's own version, which an extension must match.
 *
 * @param version - The app's version.
 * @param build - The app's build number.
 * @returns The property list.
 */
const infoOf = (version: string, build: string): string => `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>$(DEVELOPMENT_LANGUAGE)</string>
  <key>CFBundleDisplayName</key>
  <string>${TARGET}</string>
  <key>CFBundleExecutable</key>
  <string>$(EXECUTABLE_NAME)</string>
  <key>CFBundleIdentifier</key>
  <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>$(PRODUCT_NAME)</string>
  <key>CFBundlePackageType</key>
  <string>$(PRODUCT_BUNDLE_PACKAGE_TYPE)</string>
  <key>CFBundleShortVersionString</key>
  <string>${version}</string>
  <key>CFBundleVersion</key>
  <string>${build}</string>
  <key>ValenceSharedKeychainGroup</key>
  <string>${SHARED_KEYCHAIN}</string>
  <key>NSExtension</key>
  <dict>
    <key>NSExtensionPointIdentifier</key>
    <string>com.apple.usernotifications.service</string>
    <key>NSExtensionPrincipalClass</key>
    <string>$(PRODUCT_MODULE_NAME).NotificationService</string>
  </dict>
</dict>
</plist>
`;

const ENTITLEMENTS = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>keychain-access-groups</key>
  <array>
    <string>${SHARED_KEYCHAIN}</string>
  </array>
</dict>
</plist>
`;

/**
 * Adds the notification service extension to the phone app: a target of its own built from the
 * Swift in the notification service module, embedded in the app, and a keychain group the app and
 * the extension share, which is how the extension is handed the sign-in it reads a push's words
 * with. The app's own keychain group is named first, so it stays the one the app keeps everything
 * else in.
 *
 * @param config - The project being generated.
 * @returns The same project, with the extension.
 */
const withNotificationService: ConfigPlugin = (config) => {
  const bundleId = config.ios?.bundleIdentifier ?? 'app.valence.ios';
  const version = config.version ?? '1.0.0';
  const build = config.ios?.buildNumber ?? '1';
  const appleTeam = config.ios?.appleTeamId;

  const withShared = withEntitlementsPlist(config, (asked) => {
    asked.modResults['keychain-access-groups'] = [THE_APPS_OWN_KEYCHAIN, SHARED_KEYCHAIN];

    return asked;
  });

  const withGroupNamed = withInfoPlist(withShared, (asked) => {
    asked.modResults['ValenceSharedKeychainGroup'] = SHARED_KEYCHAIN;

    return asked;
  });

  return withXcodeProject(withGroupNamed, (asked) => {
    const project = asked.modResults;

    if (project.pbxTargetByName(TARGET) !== null) {
      return asked;
    }

    const folder = join(asked.modRequest.platformProjectRoot, TARGET);

    mkdirSync(folder, { recursive: true });

    for (const file of SWIFT) {
      copyFileSync(file.from, join(folder, file.name));
    }

    writeFileSync(join(folder, 'Info.plist'), infoOf(version, build));
    writeFileSync(join(folder, `${TARGET}.entitlements`), ENTITLEMENTS);

    const objects = project.hash.project.objects;

    objects['PBXTargetDependency'] ??= {};
    objects['PBXContainerItemProxy'] ??= {};

    const group = project.addPbxGroup(
      [...SWIFT.map((file) => file.name), 'Info.plist', `${TARGET}.entitlements`],
      TARGET,
      TARGET,
    );
    const mainGroup = project.getFirstProject().firstProject.mainGroup;

    project.addToPbxGroup(group.uuid, mainGroup);

    const target = project.addTarget(
      TARGET,
      'app_extension',
      TARGET,
      `${bundleId}.NotificationService`,
    );

    project.addBuildPhase(
      SWIFT.map((file) => file.name),
      'PBXSourcesBuildPhase',
      'Sources',
      target.uuid,
    );
    project.addBuildPhase([], 'PBXResourcesBuildPhase', 'Resources', target.uuid);
    project.addBuildPhase([], 'PBXFrameworksBuildPhase', 'Frameworks', target.uuid);

    const configurations = project.pbxXCBuildConfigurationSection();
    const team =
      appleTeam ??
      Object.values(configurations).flatMap((one) =>
        typeof one === 'object' && typeof one.buildSettings['DEVELOPMENT_TEAM'] === 'string'
          ? [one.buildSettings['DEVELOPMENT_TEAM']]
          : [],
      )[0];

    for (const one of Object.values(configurations)) {
      if (typeof one !== 'object' || one.buildSettings['PRODUCT_NAME'] !== `"${TARGET}"`) {
        continue;
      }

      Object.assign(one.buildSettings, {
        CODE_SIGN_ENTITLEMENTS: `${TARGET}/${TARGET}.entitlements`,
        CODE_SIGN_STYLE: 'Automatic',
        INFOPLIST_FILE: `${TARGET}/Info.plist`,
        IPHONEOS_DEPLOYMENT_TARGET: '18.0',
        PRODUCT_BUNDLE_IDENTIFIER: `${bundleId}.NotificationService`,
        SWIFT_VERSION: '5.0',
        TARGETED_DEVICE_FAMILY: '"1,2"',
        ...(team === undefined ? {} : { DEVELOPMENT_TEAM: team }),
      });
    }

    return asked;
  });
};

export { withNotificationService };
