import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { IconShare } from '@tabler/icons-react';
import { RevealItem } from '@ValenceUI/RevealItem';
import { Badge } from '@ValenceUI/Badge';
import type { Components } from 'react-markdown';
import type { ChangelogReleaseProps } from './ChangelogRelease.types';

const PULL_REQUEST_URL = /\/pull\/(?<number>\d+)\/?$/u;

const MARKDOWN_COMPONENTS: Components = {
  h1: ({ children }) => (
    <p className="mt-6 text-base font-semibold text-text first:mt-0">{children}</p>
  ),
  h2: ({ children }) => (
    <p className="mt-6 text-base font-semibold text-text first:mt-0">{children}</p>
  ),
  h3: ({ children }) => (
    <p className="mt-6 text-base font-semibold text-text first:mt-0">{children}</p>
  ),
  p: ({ children }) => <p className="text-sm leading-relaxed text-text-muted">{children}</p>,
  ul: ({ children }) => (
    <ul className="flex flex-col gap-1.5 pl-5 text-sm leading-relaxed text-text-muted">
      {children}
    </ul>
  ),
  li: ({ children }) => <li className="list-disc">{children}</li>,
  strong: ({ children }) => <strong className="font-bold text-text">{children}</strong>,
  a: ({ href, children }) => {
    const pullNumber = href === undefined ? undefined : PULL_REQUEST_URL.exec(href)?.groups?.number;

    if (pullNumber !== undefined) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-2 py-0.5 align-middle text-xs font-medium text-accent hover:bg-accent/20"
        >
          Pull {pullNumber}
          <IconShare size={12} />
        </a>
      );
    }

    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent underline-offset-2 hover:underline"
      >
        {children}
      </a>
    );
  },
  code: ({ children }) => (
    <code className="rounded bg-surface-raised px-1 py-0.5 font-mono text-xs text-text">
      {children}
    </code>
  ),
};

/**
 * One release out of the changelog: its own banner, its version and when it shipped, and its notes
 * exactly as GitHub renders them.
 *
 * @param release - The version, the title, the date, and the markdown GitHub holds for it.
 * @param index - Where it sits in the list, so it arrives in order.
 */
const ChangelogRelease = ({ release, index }: ChangelogReleaseProps) => (
  <RevealItem index={index} className="list-none border-b border-border/60 py-12 last:border-0">
    <div id={release.version} className="scroll-mt-28">
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-accent via-accent/85 to-accent/50 px-8 py-14 text-center shadow-[var(--shadow-cast)]">
        <span
          aria-hidden
          className="absolute inset-0 [background-image:radial-gradient(circle,color-mix(in_oklab,white_10%,transparent)_1px,transparent_1px)] [background-size:22px_22px]"
        />

        <p className="relative text-3xl font-bold tracking-tight text-accent-contrast sm:text-4xl">
          Valence
        </p>

        <p className="relative mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent-contrast/80">
          {release.isPrerelease ? 'Prerelease ' : ''}
          {release.version}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Badge tone="accent">{release.version}</Badge>

        {release.publishedAt === null ? null : (
          <span className="text-sm text-text-muted">{release.publishedAt}</span>
        )}

        {release.isPrerelease ? <Badge tone="warning">Prerelease</Badge> : null}
      </div>

      <h2 className="mt-4 text-2xl font-semibold tracking-tight text-text">{release.title}</h2>

      <div className="mt-4 flex flex-col gap-2">
        <Markdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
          {release.body}
        </Markdown>
      </div>
    </div>
  </RevealItem>
);

ChangelogRelease.displayName = 'ChangelogRelease';

export { ChangelogRelease };
