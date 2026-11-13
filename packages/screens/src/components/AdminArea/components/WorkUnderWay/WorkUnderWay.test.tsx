import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Job, JobDefinition } from '@ValenceClient/admin/fetchAdmin';
import type { ScanEntry } from '@ValenceScreens/components/AdminArea/scanCoordinator';
import { WorkUnderWay } from './WorkUnderWay';

const job = (overrides: Partial<Job> = {}): Job => ({
  id: 1,
  kind: 'library.scan',
  subject: 'Films',
  state: 'running',
  queuedAtMs: 0,
  startedAtMs: 0,
  finishedAtMs: null,
  correlationId: null,
  stoppedBecause: null,
  failure: null,
  ...overrides,
});

const SCAN: JobDefinition = {
  kind: 'library.scan',
  label: { code: 'common.scan', message: 'Scan', values: {} },
  group: 'library',
  description: { code: 'common.scan', message: 'Scan', values: {} },
  needsLibrary: true,
  destructive: false,
  takesParts: false,
  runsByHand: true,
  schedulable: true,
};

const PROGRESS = new Map<string, ScanEntry>([
  [
    'lib_1:library.scan',
    {
      libraryId: 'lib_1',
      kind: 'library.scan',
      phase: 'probing',
      item: 'Heat (1995).mkv',
      processed: 412,
      total: 1020,
      jobId: '1',
      isStopping: false,
    },
  ],
]);

describe('WorkUnderWay', () => {
  it('is not there while nothing is running', () => {
    const { container } = render(
      <WorkUnderWay working={[]} progress={new Map()} definitions={[SCAN]} libraries={[]} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('opens to say how much is running and waiting, and how far each job has got', async () => {
    render(
      <WorkUnderWay
        working={[job(), job({ id: 2, state: 'queued', subject: '' })]}
        progress={PROGRESS}
        definitions={[SCAN]}
        libraries={[]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Valence is working on/ }));

    expect(await screen.findByText('1 running')).toBeInTheDocument();
    expect(screen.getAllByText('Valence is working on 2 things').length).toBeGreaterThan(0);
    expect(screen.getByText('1 waiting')).toBeInTheDocument();
    expect(screen.getByText('412 of 1,020')).toBeInTheDocument();
    expect(screen.getByText(/Heat \(1995\)\.mkv/)).toBeInTheDocument();
  });

  it('starts tucked away, opens from the pill, and tucks away again at a press beside it', async () => {
    render(
      <WorkUnderWay working={[job()]} progress={PROGRESS} definitions={[SCAN]} libraries={[]} />,
    );

    expect(screen.queryByText('412 of 1,020')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Valence is working on/ }));

    expect(await screen.findByText('412 of 1,020')).toBeInTheDocument();

    fireEvent.pointerDown(document.body);

    expect(
      await screen.findByRole('button', { name: /Valence is working on/ }),
    ).toBeInTheDocument();
  });
});
