import { describe, expect, it } from 'vitest';
import {
  bounceSpring,
  popArrival,
  revealVariants,
  revealTransition,
  riseVariants,
  fadeVariants,
  staggerVariants,
} from './reveal';

describe('revealVariants', () => {
  it('lifts content into place by default', () => {
    expect(revealVariants(false)).toBe(riseVariants);
  });

  it('fades rather than moves when movement is unwelcome', () => {
    expect(revealVariants(true)).toBe(fadeVariants);
  });

  it('treats an unknown preference as no preference', () => {
    expect(revealVariants(null)).toBe(riseVariants);
  });

  it('still transitions when movement is unwelcome, rather than snapping', () => {
    expect(fadeVariants.hidden).toMatchObject({ opacity: 0 });
    expect(fadeVariants.shown).toMatchObject({ opacity: 1 });
    expect(fadeVariants.hidden).not.toHaveProperty('y');
  });
});

describe('revealTransition', () => {
  it('moves on a spring, so motion carries weight', () => {
    expect(revealTransition(false)).toMatchObject({ type: 'spring' });
  });

  it('takes longer to settle the larger the thing moving is', () => {
    expect(revealTransition(false, 'heavy')).toMatchObject({
      type: 'spring',
      stiffness: 180,
    });
    expect(revealTransition(false, 'light')).toMatchObject({
      type: 'spring',
      stiffness: 320,
    });
  });

  it('drops the spring entirely when movement is unwelcome', () => {
    expect(revealTransition(true)).not.toHaveProperty('type', 'spring');
    expect(revealTransition(true, 'heavy')).not.toHaveProperty('type', 'spring');
    expect(revealTransition(true, 'bouncy')).not.toHaveProperty('type', 'spring');
  });

  it('lands with an overshoot when asked to bounce', () => {
    expect(revealTransition(false, 'bouncy')).toBe(bounceSpring);
  });
});

describe('popArrival', () => {
  it('pops up from small with a turn, on the bouncy spring, after its wait', () => {
    const arrival = popArrival(0.2, false);

    expect(arrival.initial).toMatchObject({ opacity: 0, scale: 0.4 });
    expect(arrival.animate).toMatchObject({ opacity: 1, scale: 1, rotate: 0 });
    expect(arrival.transition).toMatchObject({ ...bounceSpring, delay: 0.2 });
  });

  it('is simply there for somebody who asked for less motion', () => {
    const arrival = popArrival(0.2, true);

    expect(arrival.initial).toBe(false);
    expect(arrival.animate).toMatchObject({ opacity: 1, scale: 1 });
    expect(arrival.transition).toMatchObject({ duration: 0 });
  });
});

describe('staggerVariants', () => {
  it('brings children in one after another', () => {
    expect(staggerVariants.shown).toMatchObject({
      transition: { staggerChildren: 0.06 },
    });
  });

  it('takes them out in the order they came, reversed', () => {
    expect(staggerVariants.gone).toMatchObject({
      transition: { staggerDirection: -1 },
    });
  });
});
