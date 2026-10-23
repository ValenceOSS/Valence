import { describe, expect, it } from 'vitest';
import { readStackPart } from './readStackPart';

describe('readStackPart', () => {
  it.each([
    ['Film (1999) - cd1.mkv', 'Film (1999)', 'cd', 1],
    ['Film (1999) - CD2.mkv', 'Film (1999)', 'cd', 2],
    ['Film (1999).part1.avi', 'Film (1999)', 'part', 1],
    ['Film (1999) pt 2.mp4', 'Film (1999)', 'pt', 2],
    ['Film (1999) [disc1].mkv', 'Film (1999)', 'disc', 1],
    ['Film (1999)_disk_3.mkv', 'Film (1999)', 'disk', 3],
    ['Film (1999)-dvd2.mkv', 'Film (1999)', 'dvd', 2],
    ['Film (1999) (cd1).mkv', 'Film (1999)', 'cd', 1],
    ['Film (1999) - parta.mkv', 'Film (1999)', 'part', 1],
    ['Film (1999) - partB.mkv', 'Film (1999)', 'part', 2],
    ['Film (1999) - cd1', 'Film (1999)', 'cd', 1],
  ])('reads %j as part %4$j of %2$j by %3$j', (fileName, name, kind, number) => {
    expect(readStackPart(fileName)).toEqual({ name, kind, number });
  });

  it.each([
    'Film (1999).mkv',
    'A Saga Part 1 (2010).mkv',
    'Film (1999) - 1080p.mkv',
    'Film (1999) - cd.mkv',
    'Film (1999) - parte.mkv',
    'Discovery (2017).mkv',
  ])('reads %j as no part of anything', (fileName) => {
    expect(readStackPart(fileName)).toBeNull();
  });
});
