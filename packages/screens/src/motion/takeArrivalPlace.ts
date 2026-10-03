import type { ArrivalBatch } from './ArrivalBatch';

const BATCH_GAP_MS = 300;

/**
 * Gives the next things to arrive their places in line, starting a fresh line when the last arrival
 * was long enough ago that these are a new wave rather than more of the same one.
 *
 * @param batch - The line so far, moved on in place.
 * @param now - When these are arriving, in milliseconds.
 * @param count - How many places to take.
 * @returns The first of the places taken.
 */
const takeArrivalPlace = (batch: ArrivalBatch, now: number, count = 1): number => {
  if (now - batch.lastAt > BATCH_GAP_MS) {
    batch.size = 0;
  }

  const place = batch.size;

  batch.size += count;
  batch.lastAt = now;

  return place;
};

export { takeArrivalPlace };
