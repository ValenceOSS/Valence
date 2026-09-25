import { describeThisPhone } from './describeThisPhone';

describe('describeThisPhone', () => {
  it('uses the name its owner gave it, which is what they will recognise', () => {
    expect(describeThisPhone()).toBe("Dan's iPhone");
  });
});
