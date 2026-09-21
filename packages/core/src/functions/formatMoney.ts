const MONEY = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

/**
 * Says an amount of money in dollars, shortened the way a headline would: `$165M`, `$1.2B`.
 *
 * @param amount - How many dollars.
 * @returns The amount, shortened.
 */
const formatMoney = (amount: number): string => MONEY.format(amount);

export { formatMoney };
