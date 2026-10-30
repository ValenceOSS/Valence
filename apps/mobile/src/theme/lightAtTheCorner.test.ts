import { lightAtTheCorner } from './lightAtTheCorner';

describe('lightAtTheCorner', () => {
  it('takes the light furthest right along the top', () => {
    expect(
      lightAtTheCorner([
        { colour: 'rgb(1, 1, 1)', at: '8% 10%' },
        { colour: 'rgb(2, 2, 2)', at: '92% 10%' },
        { colour: 'rgb(3, 3, 3)', at: '92% 86%' },
      ]),
    ).toBe('rgb(2, 2, 2)');
  });

  it('has nothing without lights', () => {
    expect(lightAtTheCorner([])).toBeNull();
  });
});
