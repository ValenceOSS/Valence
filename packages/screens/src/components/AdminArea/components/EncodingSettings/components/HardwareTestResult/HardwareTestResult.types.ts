import type { HardwareTestReport } from '@ValenceContracts/schemas/HardwareTestReport';

type HardwareTestResultProps = {
  report: HardwareTestReport | null;
  hasFailed: boolean;
};

export type { HardwareTestResultProps };
