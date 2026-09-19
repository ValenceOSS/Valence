import { describe, expect, it } from 'vitest';
import { JOB_DEFINITIONS, jobDefinitionsFor } from './jobDefinitions';

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
