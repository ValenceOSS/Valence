import { motion, useReducedMotionConfig } from 'motion/react';
import { cn } from '@ValenceUI/cn';
import { ACTING } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/ACTING';
import { MockPanel } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/MockPanel/MockPanel';

const LOG = [
  { tone: 'text-success', mark: '✓', line: 'migrations applied (87)', later: false },
  { tone: 'text-success', mark: '✓', line: 'transcoder ready · VideoToolbox', later: false },
  { tone: 'text-success', mark: '✓', line: 'library mounted read only at /media', later: false },
  { tone: 'text-text-muted', mark: '…', line: 'scanning 1,204 titles', later: false },
  { tone: 'text-success', mark: '✓', line: 'scan finished in 38 s', later: true },
  { tone: 'text-accent', mark: '→', line: 'Ready on http://localhost:8420', later: true },
] as const;

const FIRST_LATER = LOG.findIndex((entry) => entry.later);

/**
 * The one command that starts it and the few lines it says as it comes up; pointed at, it finishes coming up.
 */
const TerminalVignette = () => {
  const prefersReducedMotion = useReducedMotionConfig();

  return (
    <MockPanel title="Terminal">
      <span className="flex flex-col gap-2 font-mono text-[0.6875rem] leading-5">
        <span className="whitespace-pre-wrap break-all text-text">
          <span className="text-text-muted">$ </span>
          docker run -d -p 8420:8420 -v /srv/media:/media:ro ghcr.io/valenceoss/valence
        </span>

        <span className="flex flex-col">
          {LOG.map((entry, at) => (
            <span
              key={entry.line}
              className={cn(
                'grid',
                entry.later
                  ? cn(
                      'grid-rows-[0fr] opacity-0',
                      ACTING,
                      'acted:grid-rows-[1fr] acted:opacity-100',
                    )
                  : 'grid-rows-[1fr]',
              )}
              style={{
                transitionDelay: `${(entry.later ? (at - FIRST_LATER + 1) * 350 : 0).toString()}ms`,
              }}
            >
              <span className="min-h-0 overflow-hidden text-text-muted">
                <span className={entry.tone}>{entry.mark}</span> {entry.line}
              </span>
            </span>
          ))}
        </span>

        <span className="text-text-muted">
          ${' '}
          <motion.span
            className="inline-block h-3 w-1.5 translate-y-0.5 bg-text"
            {...(prefersReducedMotion === true
              ? {}
              : {
                  animate: { opacity: [1, 0, 1] },
                  transition: { duration: 1.1, repeat: Infinity, times: [0, 0.5, 1] },
                })}
          />
        </span>
      </span>
    </MockPanel>
  );
};

TerminalVignette.displayName = 'TerminalVignette';

export { TerminalVignette };
