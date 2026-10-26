import { Send as SendFilledIcon } from '@keyline-icons/react/fill';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { ACTING } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/ACTING';
import { PanelCard } from '@ValenceUI/PanelCard';
import { nothing } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/nothing';

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
  <PanelCard title="API reference" isFlush className="relative h-[19rem] w-[42rem]">
    <span className="flex items-center gap-2 px-4 pt-4">
      <Badge tone="success">GET</Badge>
      <span className="font-mono text-sm text-text">/api/media/{'{id}'}</span>
      <Button size="sm" variant="glossy" isIconOnly label="Send" onClick={nothing}>
        <Icon of={SendFilledIcon} size={16} />
      </Button>
    </span>

    <span className="flex flex-col py-3 font-mono text-sm leading-6">
      {CODE.map((line, at) => (
        <span
          key={at}
          className={cn(
            'whitespace-pre px-4',
            ACTING,
            at === ANSWERED ? 'acted:bg-highlight/10' : 'acted:opacity-50',
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
        'valence-float absolute left-14 top-28 flex w-[19rem] translate-y-4 flex-col gap-1.5 rounded-lg p-3 font-mono text-sm opacity-0',
        ACTING,
        'delay-300 acted:translate-y-0 acted:opacity-100',
      )}
    >
      <span className="flex items-center gap-2">
        <Badge tone="success">200 OK</Badge>
        <span className="font-sans text-text-muted">18 ms</span>
      </span>
      {ANSWER.map((line) => (
        <span key={line} className="whitespace-pre text-text">
          {line}
        </span>
      ))}
    </span>
  </PanelCard>
);

ContractPicture.displayName = 'ContractPicture';

export { ContractPicture };
