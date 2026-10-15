import { describe, expect, it } from 'vitest';
import { WayInMessageSchema } from './WayInMessage';

describe('WayInMessageSchema', () => {
  it('reads a message with a colour of its own', () => {
    expect(WayInMessageSchema.parse({ text: 'Welcome home', colour: '#FF8800' })).toEqual({
      text: 'Welcome home',
      colour: '#FF8800',
    });
  });

  it('takes the theme’s own colour where none is given', () => {
    expect(WayInMessageSchema.parse({ text: 'Welcome home' }).colour).toBeNull();
  });

  it('refuses a colour that is not a six digit hex code', () => {
    expect(WayInMessageSchema.safeParse({ text: 'Hi', colour: 'red' }).success).toBe(false);
    expect(WayInMessageSchema.safeParse({ text: 'Hi', colour: '#f80' }).success).toBe(false);
  });

  it('refuses an empty message', () => {
    expect(WayInMessageSchema.safeParse({ text: '   ' }).success).toBe(false);
  });
});
