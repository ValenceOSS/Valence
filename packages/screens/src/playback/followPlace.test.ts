import { describe, expect, it } from 'vitest';
import { followPlace } from '@ValenceScreens/playback/followPlace';

const anElement = () => {
  const element = document.createElement('video');

  Object.defineProperty(element, 'readyState', { configurable: true, writable: true, value: 0 });

  return element;
};

const playAt = (element: HTMLVideoElement, seconds: number) => {
  Object.defineProperty(element, 'readyState', { configurable: true, value: 4 });
  element.currentTime = seconds;
  element.dispatchEvent(new Event('timeupdate'));
};

const resetTo = (element: HTMLVideoElement, seconds: number) => {
  Object.defineProperty(element, 'readyState', { configurable: true, value: 0 });
  element.currentTime = seconds;
};

describe('followPlace', () => {
  it('is where the film was asked to begin until it has a place of its own', () => {
    expect(followPlace(anElement(), 1720).read()).toBe(1720);
  });

  it('follows the picture as it plays', () => {
    const element = anElement();
    const place = followPlace(element, 4);

    playAt(element, 31.5);

    expect(place.read()).toBe(31.5);
  });

  it('follows a seek before there is a picture where it went', () => {
    const element = anElement();
    const place = followPlace(element, 4);

    element.currentTime = 3600;
    element.dispatchEvent(new Event('seeking'));

    expect(place.read()).toBe(3600);
  });

  it('never takes a reading of the very start as a place', () => {
    const element = anElement();
    const place = followPlace(element, 4);

    playAt(element, 1657);
    Object.defineProperty(element, 'readyState', { configurable: true, value: 2 });
    element.currentTime = 0;
    element.dispatchEvent(new Event('timeupdate'));
    element.dispatchEvent(new Event('seeking'));

    expect(place.read()).toBe(1657);
  });

  it('takes where the element refused, where it can still say', () => {
    const element = anElement();
    const place = followPlace(element, 4);

    playAt(element, 14);
    element.currentTime = 15;
    element.dispatchEvent(new Event('error'));

    expect(place.read()).toBe(15);
  });

  it('holds where it was while an engine starts the emptied element again at the start', () => {
    const element = anElement();
    const place = followPlace(element, 4);

    playAt(element, 1731);
    resetTo(element, 0);
    element.dispatchEvent(new Event('error'));
    element.dispatchEvent(new Event('emptied'));
    element.dispatchEvent(new Event('seeking'));
    playAt(element, 0.04);
    element.currentTime = 0.5;
    element.dispatchEvent(new Event('seeking'));

    expect(place.read()).toBe(1731);
  });

  it('follows the viewer seeking somewhere else while it is held', () => {
    const element = anElement();
    const place = followPlace(element, 4);

    playAt(element, 1731);
    resetTo(element, 0);
    element.dispatchEvent(new Event('error'));
    element.currentTime = 2400;
    element.dispatchEvent(new Event('seeking'));
    playAt(element, 2410);

    expect(place.read()).toBe(2410);
  });

  it('holds where it was from being emptied once it had a picture', () => {
    const element = anElement();
    const place = followPlace(element, 4);

    playAt(element, 1657);
    resetTo(element, 0);
    element.dispatchEvent(new Event('emptied'));
    playAt(element, 3);

    expect(place.read()).toBe(1657);
  });

  it('lets go once a picture plays where it was held', () => {
    const element = anElement();
    const place = followPlace(element, 4);

    playAt(element, 1731);
    resetTo(element, 0);
    element.dispatchEvent(new Event('error'));
    playAt(element, 1731.5);
    playAt(element, 1760);

    expect(place.read()).toBe(1760);
  });

  it('is not held by being emptied on its way to a first picture', () => {
    const element = anElement();
    const place = followPlace(element, 4);

    element.dispatchEvent(new Event('emptied'));
    playAt(element, 30);

    expect(place.read()).toBe(30);
  });

  it('stops following once told to', () => {
    const element = anElement();
    const place = followPlace(element, 4);

    place.stop();
    playAt(element, 30);

    expect(place.read()).toBe(4);
  });
});
