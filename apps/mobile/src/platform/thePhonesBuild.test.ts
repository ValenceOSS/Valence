import { thePhonesBuild } from './thePhonesBuild';

describe('thePhonesBuild', () => {
  it('says what it runs on, and falls back to a version where none was stamped', () => {
    const build = thePhonesBuild();

    expect(build.runsOn).toMatch(/^iOS /u);
    expect(build.commit).toBeNull();
    expect(build.version).toMatch(/^\d+\.\d+\.\d+/u);
  });
});
