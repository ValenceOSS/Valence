import { describe, expect, it } from 'vitest';
import { TelemetryReportSchema } from '@ValenceContracts/schemas/TelemetryReport';
import { fakeReportOf } from './fakeReportOf';
import { seededRandom } from './seededRandom';

const ID = '7d0b3c7e-2f0a-4c55-9d43-1c7a7a3e9b10';

describe('fakeReportOf', () => {
  it('makes up reports that keep to the contract', () => {
    const random = seededRandom(412);

    for (let made = 0; made < 40; made += 1) {
      expect(TelemetryReportSchema.safeParse(fakeReportOf(ID, random)).success).toBe(true);
    }
  });

  it('makes up the same report from the same seed', () => {
    expect(fakeReportOf(ID, seededRandom(7))).toStrictEqual(fakeReportOf(ID, seededRandom(7)));
  });

  it('picks the last choice where the chance runs to the very top', () => {
    expect(fakeReportOf(ID, () => 0.999_999_999).version).toBe('0.6.0');
  });
});
