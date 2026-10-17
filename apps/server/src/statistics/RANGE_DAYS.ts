import type { StatisticsRange } from '@ValenceContracts/schemas/Statistics';

const RANGE_DAYS: Readonly<Record<StatisticsRange, number>> = {
  week: 7,
  month: 30,
  quarter: 90,
  year: 365,
};

export { RANGE_DAYS };
