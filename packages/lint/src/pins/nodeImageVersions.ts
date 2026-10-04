const NODE_IMAGE = /^FROM\s+(?:--platform=\S+\s+)?node:(?<version>[^\s-]+)/gmu;

/**
 * Lists the Node versions a Dockerfile's stages are built on.
 *
 * @param dockerfile - The contents of the Dockerfile.
 * @returns The version each `FROM node:` line names, in order.
 */
const nodeImageVersions = (dockerfile: string): string[] =>
  [...dockerfile.matchAll(NODE_IMAGE)].flatMap((found) => found.groups?.['version'] ?? []);

export { nodeImageVersions };
