import { Prisma } from '@prisma/client';

/**
 * JSON.stringify replacer. Prisma returns DECIMAL columns (coordinates,
 * temperatures) as Decimal objects, which serialize as strings; the API
 * contract is numbers. `this[key]` is the value before its toJSON() ran.
 */
export function decimalsAsNumbers(this: unknown, key: string, value: unknown): unknown {
  const original = (this as Record<string, unknown>)[key];
  return Prisma.Decimal.isDecimal(original) ? original.toNumber() : value;
}
