import { z } from 'zod';
import type { GithubReleaseJson } from 'virtual:changelog';

const githubReleaseSchema = z.object({
  tag_name: z.string(),
  name: z.string().nullable(),
  body: z.string().nullable(),
  published_at: z.string().nullable(),
  html_url: z.string(),
  prerelease: z.boolean(),
  draft: z.boolean(),
});

type Release = {
  version: string;
  title: string;
  body: string;
  publishedAt: string | null;
  url: string;
  isPrerelease: boolean;
};

const HTML_COMMENT = /<!--[\s\S]*?-->/gu;

const MENTION = /@[\w-]+/gu;

/**
 * Drops the HTML comments release-please and GitHub's own release-note generator leave in a
 * release body — instructions to a tool, not prose for a reader — since `react-markdown` renders
 * comments as plain text rather than hiding them the way a browser parsing real HTML would.
 *
 * @param body - The release's raw markdown body.
 * @returns The same body with every HTML comment removed.
 */
const stripComments = (body: string): string => body.replace(HTML_COMMENT, '').trim();

/**
 * Marks up every `@name` mention as bold markdown, so the person who did the work reads as a name
 * rather than plain text in the middle of a sentence — GitHub's own UI links these, but the raw
 * body carries them as bare text.
 *
 * @param body - The release's markdown body.
 * @returns The same body with every mention wrapped in `**`.
 */
const emphasiseMentions = (body: string): string => body.replace(MENTION, '**$&**');

/**
 * Turns GitHub's own release objects into what the changelog page needs, dropping drafts — which
 * are not published yet — since they are not a release, they are a release still being written.
 *
 * @param raw - The releases, exactly as GitHub's API returns them.
 * @returns Every published release, in the order GitHub names them.
 */
const readReleases = (raw: GithubReleaseJson[]): Release[] =>
  githubReleaseSchema
    .array()
    .parse(raw)
    .filter((release) => !release.draft)
    .map((release) => ({
      version: release.tag_name,
      title: release.name ?? release.tag_name,
      body: emphasiseMentions(stripComments(release.body ?? '')),
      publishedAt: release.published_at === null ? null : release.published_at.slice(0, 10),
      url: release.html_url,
      isPrerelease: release.prerelease,
    }));

export type { Release };

export { readReleases };
