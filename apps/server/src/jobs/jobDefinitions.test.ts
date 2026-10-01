import { describe, expect, it } from 'vitest';
import { DEFAULT_JOB_TRIGGERS, JOB_DEFINITIONS, jobDefinitionsFor } from './jobDefinitions';

describe('jobDefinitionsFor', () => {
  it('offers every job when requesting is on', () => {
    expect(jobDefinitionsFor(true)).toEqual(JOB_DEFINITIONS);
  });

  it('leaves out the jobs that speak to the requests service when requesting is off, and nothing else', () => {
    const offered = jobDefinitionsFor(false).map((definition) => definition.kind);

    expect(offered).not.toContain('server.checkRequests');
    expect(offered).not.toContain('requests.refreshCatalogue');
    expect(offered).toHaveLength(JOB_DEFINITIONS.length - 2);
  });
});

describe('the pre-transcoding job', () => {
  it('can be scheduled and run by hand, and looks every fifteen minutes unless told otherwise', () => {
    const definition = JOB_DEFINITIONS.find((one) => one.kind === 'library.preTranscode');

    expect(definition).toMatchObject({ schedulable: true, runsByHand: true, needsLibrary: false });
    expect(DEFAULT_JOB_TRIGGERS['library.preTranscode']).toEqual([
      { kind: 'everyMinutes', minutes: 15 },
    ]);
  });
});
