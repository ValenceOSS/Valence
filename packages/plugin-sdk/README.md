# Valence plugin SDK

Everything a Valence plugin is written against: the manifest, the permissions it asks for, the
building blocks its pages are made of, themes, the host API it calls, and the package format and
signing tools that ship it.

The quickest start is the template: [ValenceOSS/valence-plugin-template](https://github.com/ValenceOSS/valence-plugin-template).
Two complete plugins live in [ValenceOSS/valence-plugins](https://github.com/ValenceOSS/valence-plugins).

## How a plugin runs

A plugin never runs in a client. Not on the web, not on a phone, not on a TV. It runs on the
server, in a process of its own, inside a JavaScript interpreter compiled to WebAssembly that has no
`require`, no `process`, no `fetch` and no file system. Everything it can do arrives as the
`valence` object in each handler's context, and every call is checked against the permissions the
administrator accepted when installing it.

What a plugin shows is described, not drawn: it returns a surface made of Valence's own building
blocks (rows, buttons, toggles, text fields and so on), and each app draws those with its own
components. When somebody presses a button, the action goes back to the plugin on the server, which
answers with the next surface.

## Install

The SDK is TypeScript source, consumed from git:

```json
{
  "dependencies": {
    "@valence/plugin-sdk": "github:ValenceOSS/Valence#path:/packages/plugin-sdk"
  },
  "devDependencies": {
    "esbuild": "^0.25.0",
    "tsx": "^4.20.0",
    "typescript": "^5.9.0"
  }
}
```

Its modules import each other through the `@ValenceSDK/*` alias, so point that alias at the
package in your `tsconfig.json` (esbuild and tsx both read it):

```json
{
  "compilerOptions": {
    "paths": { "@ValenceSDK/*": ["./node_modules/@valence/plugin-sdk/src/*"] }
  }
}
```

## Write

```ts
import { definePlugin } from '@ValenceSDK/host/definePlugin';

definePlugin({
  pages: {
    hello: {
      render: async ({ valence, viewer }) => {
        const visits = Number((await valence.storage.get(`visits:${viewer.profileId}`)) ?? 0) + 1;

        await valence.storage.set(`visits:${viewer.profileId}`, visits);

        return {
          title: 'Hello',
          blocks: [
            { type: 'heading', text: 'Hello from a plugin' },
            { type: 'text', text: `You have opened this page ${visits.toString()} times.` },
          ],
        };
      },
    },
  },
});
```

```json
{
  "manifestVersion": 2,
  "id": "hello",
  "name": "Hello",
  "version": "1.0.0",
  "apiVersion": "^1.0",
  "author": { "name": "You" },
  "description": "Says hello.",
  "permissions": [{ "kind": "storage", "quotaBytes": 10000 }],
  "contributes": { "pages": [{ "id": "hello", "title": "Hello", "placement": "account" }] },
  "entry": "dist/plugin.js"
}
```

## Build, pack and sign

Bundle to one file, then pack the folder:

```sh
esbuild src/plugin.ts --bundle --format=iife --platform=neutral --target=es2023 --outfile=dist/plugin.js
tsx node_modules/@valence/plugin-sdk/src/cli/valencePlugin.ts pack . --out packages
```

`valence-plugin` has four commands:

| Command | What it does |
| --- | --- |
| `pack [folder] [--out dist]` | Packs `manifest.json`, the entry it names and pictures under `assets/` (png, jpg or webp) into `<id>-<version>.vplugin` |
| `sign <file> [--key key.pem]` | Writes `<file>.sig`, an Ed25519 signature, with the key from `--key` or `VALENCE_PLUGIN_SIGNING_KEY` |
| `keygen <key-id> [--out keys]` | Makes a key pair: `<key-id>.pem` (keep it secret) and `<key-id>.pub.pem` |
| `catalogue <folder> --key-id … --package-url … --source-url … --icon-url … [--out site]` | Builds and signs `catalogue.json` from every package in a folder. Templates take `{id}`, `{version}` and `{file}` |

An administrator can install an unsigned package by uploading it, after a warning. Packages in the
official catalogue are signed by Valence's key, which every server trusts.

## What is in here

| Folder | What it holds |
| --- | --- |
| `manifest/` | `PluginManifestSchema` (manifest v2), `PermissionSchema`, `ContributionsSchema`, `EVENT_TOPICS`, `PLUGIN_API_VERSION` |
| `host/` | `definePlugin`, `PluginDefinition` (handlers), `ValenceHost` (everything a plugin can call) |
| `surface/` | `SurfaceSchema` and `SurfaceBlockSchema` (the building blocks), actions, image references, limits |
| `theme/` | `PluginThemeSchema`, with the readability check every theme must pass |
| `package/` | The `.vplugin` format, the catalogue format, packing, reading, hashing, signing and verifying |
| `cli/` | The `valence-plugin` command |

The full guide, with every permission, host method and building block, is at
[docs.getvalence.app/develop/plugins](https://docs.getvalence.app/develop/plugins).
