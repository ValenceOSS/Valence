import { describe, expect, it } from 'vitest';
import { readLanguages } from '@ValenceRequests/releases/readLanguages';
import { spacedName } from '@ValenceRequests/releases/spacedName';

const read = (name: string) => readLanguages(spacedName(name));

describe('readLanguages', () => {
  it('reads a language written out in the name', () => {
    expect(read('Dune.2021.1080p.BluRay.GERMAN.x264-GRP')).toEqual(['de']);
    expect(read('Le.Samourai.1967.1080p.FRENCH.BluRay')).toEqual(['fr']);
  });

  it('reads the short forms scene names use', () => {
    expect(read('Akira.1988.1080p.JPN.BluRay')).toEqual(['ja']);
    expect(read('Amelie.2001.1080p.VFF.BluRay')).toEqual(['fr']);
  });

  it('reads more than one where the name says more than one', () => {
    expect(read('Parasite.2019.1080p.KOREAN.ENGLISH.BluRay')).toEqual(['en', 'ko']);
  });

  it('says nothing for a name that names no language', () => {
    expect(read('Dune.2021.2160p.WEB-DL.DV.HDR10.DDP5.1.Atmos-GRP')).toEqual([]);
  });

  it('says nothing for MULTI or DUAL, which do not say which', () => {
    expect(read('Dune.2021.1080p.MULTi.BluRay.x264-GRP')).toEqual([]);
    expect(read('Dune.2021.1080p.DUAL.BluRay.x264-GRP')).toEqual([]);
  });

  it('does not find a language inside another word', () => {
    expect(read('Engineering.Disasters.S01E01.1080p.WEB')).toEqual([]);
    expect(read('The.Italian.Job.2003.1080p.BluRay')).toEqual(['it']);
  });

  it('reads a language tagged where a group name would sit, which is where Italian is tagged', () => {
    expect(read('Dune.2021.1080p.BluRay.x264-ITA')).toEqual(['it']);
  });
});
