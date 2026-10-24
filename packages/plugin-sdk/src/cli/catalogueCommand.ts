import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import type { Catalogue, CatalogueVersion } from '@ValenceSDK/package/CatalogueSchema';
import { CatalogueSchema } from '@ValenceSDK/package/CatalogueSchema';
import { readPluginPackage } from '@ValenceSDK/package/readPluginPackage';
import { sha256Of } from '@ValenceSDK/package/sha256Of';
import { compareVersions } from '@ValenceSDK/package/compareVersions';
import { signBytes } from '@ValenceSDK/package/signBytes';
import { fillTemplate } from './fillTemplate';

const MOST_EARLIER_VERSIONS = 20;

type CatalogueOptions = {
  packagesDirectory: string;
  outDirectory: string;
  keyId: string;
  privateKeyPem: string;
  packageUrl: string;
  sourceUrl: string;
  iconUrl: string;
  now: Date;
};

/**
 * Builds a signed catalogue from a folder of packed plugins: each package is opened, checked and
 * signed, its icon is written out beside the catalogue, and the catalogue itself is signed as a
 * whole so a server can trust the list before it trusts anything on it. Where the folder holds
 * several versions of one plugin, the newest is its entry and the rest are listed under it as
 * earlier versions, newest first, so a server on an older plugin API can still find one it runs;
 * the 20 newest of those are kept and older ones left out.
 *
 * @param options - Where the packages are, where to write, the key, and the address templates.
 * @returns The catalogue that was written.
 */
const catalogueCommand = (options: CatalogueOptions): Catalogue => {
  const files = readdirSync(options.packagesDirectory)
    .filter((name) => name.endsWith('.vplugin'))
    .sort();

  mkdirSync(join(options.outDirectory, 'icons'), { recursive: true });

  const packed = files.map((file) => {
    const bytes = readFileSync(join(options.packagesDirectory, file));
    const opened = readPluginPackage(bytes);

    if (!opened.ok) {
      throw new Error(`${file}: ${opened.problem}`);
    }

    const { manifest, assets } = opened.plugin;
    const holes = { id: manifest.id, version: manifest.version, file: basename(file) };
    const icon = manifest.icon === undefined ? undefined : assets[manifest.icon];
    const iconFile = manifest.icon === undefined ? undefined : `${manifest.id}-${manifest.icon}`;

    return {
      iconBytes: icon,
      iconFile,
      id: manifest.id,
      name: manifest.name,
      description: manifest.description,
      author: manifest.author.name,
      version: manifest.version,
      apiVersion: manifest.apiVersion,
      kinds: [
        ...(manifest.entry === undefined ? [] : (['extension'] as const)),
        ...(manifest.contributes.themes.length === 0 ? [] : (['theme'] as const)),
      ],
      permissions: manifest.permissions,
      packageUrl: fillTemplate(options.packageUrl, holes),
      sha256: sha256Of(bytes),
      signature: signBytes(bytes, options.privateKeyPem),
      keyId: options.keyId,
      ...(iconFile === undefined
        ? {}
        : { iconUrl: fillTemplate(options.iconUrl, { ...holes, file: iconFile }) }),
      sourceUrl: fillTemplate(options.sourceUrl, holes),
      publishedAt: options.now.toISOString(),
    };
  });

  const byId = new Map<string, typeof packed>();

  for (const each of packed) {
    byId.set(each.id, [...(byId.get(each.id) ?? []), each]);
  }

  const plugins = [...byId.values()].map((versions) => {
    const [newest, ...rest] = versions.toSorted((first, second) =>
      compareVersions(second.version, first.version),
    );

    if (newest === undefined) {
      throw new Error('A plugin with no versions cannot be listed.');
    }

    const twice = rest.find(
      (each, at) =>
        compareVersions(each.version, (at === 0 ? newest : rest[at - 1])?.version ?? '') === 0,
    );

    if (twice !== undefined) {
      throw new Error(`${newest.id} ${twice.version} is packed twice.`);
    }

    const earlier = rest.slice(0, MOST_EARLIER_VERSIONS).map((each): CatalogueVersion => ({
      version: each.version,
      apiVersion: each.apiVersion,
      permissions: each.permissions,
      packageUrl: each.packageUrl,
      sha256: each.sha256,
      signature: each.signature,
      keyId: each.keyId,
      publishedAt: each.publishedAt,
    }));

    const { iconBytes, iconFile, ...entry } = newest;

    if (iconBytes !== undefined && iconFile !== undefined) {
      writeFileSync(
        join(options.outDirectory, 'icons', iconFile),
        Buffer.from(iconBytes, 'base64'),
      );
    }

    return { ...entry, earlier };
  });

  const catalogue = CatalogueSchema.parse({
    format: 1,
    generatedAt: options.now.toISOString(),
    plugins,
  });
  const text = `${JSON.stringify(catalogue, null, 2)}\n`;

  writeFileSync(join(options.outDirectory, 'catalogue.json'), text);
  writeFileSync(
    join(options.outDirectory, 'catalogue.json.sig'),
    `${signBytes(Buffer.from(text), options.privateKeyPem)}\n`,
  );

  return catalogue;
};

export type { CatalogueOptions };

export { catalogueCommand };
