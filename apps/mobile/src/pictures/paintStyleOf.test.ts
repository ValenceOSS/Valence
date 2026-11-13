import { paintStyleOf } from './paintStyleOf';

describe('paintStyleOf', () => {
  it('paints one colour flat', () => {
    expect(paintStyleOf('#3a8ee8', null)).toEqual({ backgroundColor: '#3a8ee8' });
  });

  it('paints a gradient from one colour to the other', () => {
    expect(paintStyleOf('#ff7a59', '#e83a90')).toEqual({
      backgroundColor: '#ff7a59',
      experimental_backgroundImage: 'linear-gradient(135deg, #ff7a59, #e83a90)',
    });
  });
});
