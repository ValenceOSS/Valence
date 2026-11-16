import { describe, expect, it } from 'vitest';
import { installerHooks } from './installerHooks';

const GUID = '54c29a86-3126-5144-b248-6bb15fc8a995';

describe('installerHooks', () => {
  const hooks = installerHooks(GUID);

  it('finds the Electron app where electron-builder registered it for this user', () => {
    expect(hooks).toContain(`ReadRegStr $R0 HKCU "Software\\${GUID}" "InstallLocation"`);
    expect(hooks).toContain('${FileExists} "$R0\\Uninstall Valence.exe"');
  });

  it("runs the Electron app's uninstaller quietly from a copy, waiting for it, keeping its data", () => {
    expect(hooks).toContain(
      'ExecWait \'"$PLUGINSDIR\\electron-uninstaller.exe" /S /KEEP_APP_DATA /currentuser --updated _?=$R0\'',
    );
    expect(hooks).not.toContain('--delete-app-data');
  });

  it('removes the Electron app before anything of this one is installed', () => {
    expect(hooks.indexOf('NSIS_HOOK_PREINSTALL')).toBeLessThan(hooks.indexOf('ExecWait'));
    expect(hooks.indexOf('ExecWait')).toBeLessThan(hooks.indexOf('NSIS_HOOK_POSTINSTALL'));
  });

  it("starts the app again when the Electron app's updater asked for it", () => {
    expect(hooks).toContain('${GetOptions} $R1 "--force-run" $R0');
    expect(hooks).toContain('nsis_tauri_utils::RunAsUser "$INSTDIR\\${MAINBINARYNAME}.exe" ""');
  });

  it('takes away a desktop shortcut the Electron app did not have', () => {
    expect(hooks).toContain('${IfNot} ${FileExists} "$DESKTOP\\${PRODUCTNAME}.lnk"');
    expect(hooks).toContain('Delete "$DESKTOP\\${PRODUCTNAME}.lnk"');
  });

  it('defines each hook once and closes it', () => {
    expect(hooks.match(/^!macro /gmu)).toHaveLength(2);
    expect(hooks.match(/^!macroend$/gmu)).toHaveLength(2);
  });
});
