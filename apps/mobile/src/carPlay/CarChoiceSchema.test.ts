import { CarChoiceSchema } from './CarChoiceSchema';

describe('CarChoiceSchema', () => {
  it('takes a row the car says was chosen, and nothing without one', () => {
    expect(CarChoiceSchema.safeParse({ id: 'liked' }).success).toBe(true);
    expect(CarChoiceSchema.safeParse({ id: '' }).success).toBe(false);
    expect(CarChoiceSchema.safeParse({}).success).toBe(false);
  });
});
