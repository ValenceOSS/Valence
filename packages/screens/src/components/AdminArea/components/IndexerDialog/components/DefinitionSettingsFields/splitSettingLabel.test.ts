import { describe, expect, it } from 'vitest';
import { splitSettingLabel } from './splitSettingLabel';

describe('splitSettingLabel', () => {
  it('splits a label into its title and the explanation after it', () => {
    expect(
      splitSettingLabel('Disable sorting - the site stops sorting under load - disable if empty'),
    ).toEqual({
      title: 'Disable sorting',
      detail: 'The site stops sorting under load - disable if empty',
    });
  });

  it('leaves a label with no explanation whole', () => {
    expect(splitSettingLabel('Username')).toEqual({ title: 'Username', detail: null });
  });

  it('leaves a label whole where the dash comes too late to end a title', () => {
    const long = 'Search freeleech torrents only because the tracker counts every other one - ok';

    expect(splitSettingLabel(long)).toEqual({ title: long, detail: null });
  });
});
