const DEV_BUILD = /-dev\.([0-9a-f]{7,40})$/u;

/**
 * Reads the commit a development build was made from out of the version it reports, such as
 * `1.9.0-dev.3a2e85d`, or nothing for a release or any other build.
 *
 * @param version - The version this server reports.
 * @returns The commit, or null where this is not a development build.
 */
const devCommitOf = (version: string): string | null => DEV_BUILD.exec(version.trim())?.[1] ?? null;

export { devCommitOf };
