import { Badge } from '@ValenceUI/Badge';
import { cn } from '@ValenceUI/cn';
import { ACTING } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/ACTING';
import { MockPanel } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/MockPanel/MockPanel';

const CODE = [
  [
    ['text-accent', 'const '],
    ['text-text', 'getMedia'],
    ['text-text-muted', ' = '],
    ['text-accent', 'createRoute'],
    ['text-text-muted', '({'],
  ],
  [
    ['text-text-muted', '  method: '],
    ['text-success', "'get'"],
    ['text-text-muted', ','],
  ],
  [
    ['text-text-muted', '  path: '],
    ['text-success', "'/api/media/{id}'"],
    ['text-text-muted', ','],
  ],
  [
    ['text-text-muted', '  request: { params: '],
    ['text-text', 'MediaParams'],
    ['text-text-muted', ' },'],
  ],
  [['text-text-muted', '  responses: {']],
  [
    ['text-highlight', '    200'],
    ['text-text-muted', ': json('],
    ['text-text', 'MediaDetail'],
    ['text-text-muted', '),'],
  ],
  [
    ['text-highlight', '    404'],
    ['text-text-muted', ': json('],
    ['text-text', 'Refusal'],
    ['text-text-muted', '),'],
  ],
  [['text-text-muted', '  },']],
  [['text-text-muted', '});']],
] as const;

const ANSWERED = 5;

const ANSWER = [
  '{',
  '  "id": "m_8f2c41",',
  '  "title": "Harbour Lights",',
  '  "year": 2024',
  '}',
] as const;

/**
 * A route declared as a contract; pointed at, it is called, the answer it promised is picked out, and that answer arrives.
 */
const ContractPicture = () => (
  <MockPanel
    title="API reference"
    isFlush
    actions={
      <>
        <Badge size="sm" tone="success">
          GET
        </Badge>
        <span className="font-mono text-xs text-text">/api/media/{'{id}'}</span>
      </>
    }
    className="relative"
  >
    <span className="flex flex-col py-2.5 font-mono text-[0.6875rem] leading-5">
      {CODE.map((line, at) => (
        <span
          key={at}
          className={cn(
            'whitespace-pre px-3',
            ACTING,
            at === ANSWERED ? 'acted:bg-highlight/10' : 'acted:opacity-60',
          )}
        >
          {line.map(([tone, text], part) => (
            <span key={part} className={tone}>
              {text}
            </span>
          ))}
        </span>
      ))}
    </span>

    <span
      className={cn(
        'valence-float absolute bottom-3 right-3 flex w-[62%] translate-y-4 flex-col gap-1 rounded-lg p-2.5 font-mono text-[0.625rem] opacity-0',
        ACTING,
        'delay-300 acted:translate-y-0 acted:opacity-100',
      )}
    >
      <span className="flex items-center gap-2">
        <Badge size="sm" tone="success">
          200 OK
        </Badge>
        <span className="font-sans text-text-muted">18 ms</span>
      </span>
      {ANSWER.map((line) => (
        <span key={line} className="whitespace-pre text-text">
          {line}
        </span>
      ))}
    </span>
  </MockPanel>
);

ContractPicture.displayName = 'ContractPicture';

export { ContractPicture };
