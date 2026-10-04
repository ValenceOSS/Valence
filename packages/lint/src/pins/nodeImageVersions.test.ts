import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { nodeImageVersions } from './nodeImageVersions';

const ROOT = join(import.meta.dirname, '..', '..', '..', '..');

const DOCKERFILES = [
  'docker/server.Dockerfile',
  'apps/requests/Dockerfile',
  'apps/docs/Dockerfile',
  'apps/landing/Dockerfile',
];

const EasSchema = z.object({ build: z.object({ base: z.object({ node: z.string() }) }) });

const nvmrc = readFileSync(join(ROOT, '.nvmrc'), 'utf8').trim();

describe('nodeImageVersions', () => {
  it('reads the version each Node stage is built on', () => {
    const dockerfile = [
      'FROM rust:1.98-bookworm AS transcoder-build',
      'FROM node:24.21.0-bookworm-slim AS web-build',
      '# FROM node:22 would be a comment',
      'FROM node:24.21.0-bookworm-slim AS runtime',
    ].join('\n');

    expect(nodeImageVersions(dockerfile)).toEqual(['24.21.0', '24.21.0']);
  });

  it('names one exact Node in .nvmrc, which CI installs', () => {
    expect(nvmrc).toMatch(/^\d+\.\d+\.\d+$/u);
  });

  it.each(DOCKERFILES)('builds %s on the Node .nvmrc names', (dockerfile) => {
    const versions = nodeImageVersions(readFileSync(join(ROOT, dockerfile), 'utf8'));

    expect(versions.length).toBeGreaterThan(0);
    expect(new Set(versions)).toEqual(new Set([nvmrc]));
  });

  it('builds the phone app on the Node .nvmrc names', () => {
    const eas = EasSchema.parse(
      JSON.parse(readFileSync(join(ROOT, 'apps', 'mobile', 'eas.json'), 'utf8')),
    );

    expect(eas.build.base.node).toBe(nvmrc);
  });
});
