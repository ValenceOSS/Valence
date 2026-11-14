import { describe, expect, it } from 'vitest';
import { createStreamSlots } from './createStreamSlots';

describe('createStreamSlots', () => {
  it('counts a stream being started against the limit, before it has started', () => {
    const slots = createStreamSlots();

    expect(slots.take('films', 2, 0)).not.toBeNull();
    expect(slots.take('films', 2, 0)).not.toBeNull();
    expect(slots.take('films', 2, 0)).toBeNull();
    expect(slots.take('anime', 2, 0)).not.toBeNull();
  });

  it('counts what is already playing as well', () => {
    expect(createStreamSlots().take('films', 2, 2)).toBeNull();
  });

  it('frees a slot once given back, and only once however often it is given back', () => {
    const slots = createStreamSlots();
    const first = slots.take('films', 1, 0);

    expect(slots.take('films', 1, 0)).toBeNull();

    first?.();
    first?.();

    const second = slots.take('films', 1, 0);

    expect(second).not.toBeNull();
    expect(slots.take('films', 1, 0)).toBeNull();
  });

  it('leaves a server with no limit unlimited', () => {
    const slots = createStreamSlots();

    for (let asked = 0; asked < 50; asked += 1) {
      expect(slots.take('films', null, asked)).not.toBeNull();
    }
  });
});
