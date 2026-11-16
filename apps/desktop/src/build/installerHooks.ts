const UNINSTALLER = 'Uninstall Valence.exe';

/**
 * Writes the hooks Tauri's Windows installer runs around installing, which take over from the
 * Electron app when it is what is installed: before installing, the Electron app's own uninstaller
 * is run quietly, keeping its data, as electron-builder runs the last version's on an update; after
 * installing, the app is started again where the Electron app's updater asked for it with
 * `--force-run`, which Tauri's installer does not know. Where the Electron app had no shortcut on
 * the desktop, the one a quiet install makes is taken away again.
 *
 * NSIS script, because that is all the installer reads; the file is written at build time and never
 * kept in the repository.
 *
 * @param guid - The GUID electron-builder installed the Electron app under.
 * @returns The hooks, as an NSIS header for `bundle.windows.nsis.installerHooks`.
 */
const installerHooks = (guid: string): string =>
  [
    '!macro NSIS_HOOK_PREINSTALL',
    '  Var /GLOBAL ValenceWasElectron',
    '  Var /GLOBAL ValenceElectronHadNoDesktopShortcut',
    '  StrCpy $ValenceWasElectron "0"',
    '  StrCpy $ValenceElectronHadNoDesktopShortcut "0"',
    `  ReadRegStr $R0 HKCU "Software\\${guid}" "InstallLocation"`,
    '  ${If} $R0 != ""',
    `  \${AndIf} \${FileExists} "$R0\\${UNINSTALLER}"`,
    '    StrCpy $ValenceWasElectron "1"',
    '    ${IfNot} ${FileExists} "$DESKTOP\\${PRODUCTNAME}.lnk"',
    '      StrCpy $ValenceElectronHadNoDesktopShortcut "1"',
    '    ${EndIf}',
    '    InitPluginsDir',
    `    CopyFiles /SILENT /FILESONLY "$R0\\${UNINSTALLER}" "$PLUGINSDIR\\electron-uninstaller.exe"`,
    '    ExecWait \'"$PLUGINSDIR\\electron-uninstaller.exe" /S /KEEP_APP_DATA /currentuser --updated _?=$R0\' $R1',
    '    Delete "$PLUGINSDIR\\electron-uninstaller.exe"',
    '    RMDir "$R0"',
    '  ${EndIf}',
    '!macroend',
    '',
    '!macro NSIS_HOOK_POSTINSTALL',
    '  ${If} $ValenceWasElectron == "1"',
    '  ${AndIf} $ValenceElectronHadNoDesktopShortcut == "1"',
    '    Delete "$DESKTOP\\${PRODUCTNAME}.lnk"',
    '  ${EndIf}',
    '  ${GetParameters} $R1',
    '  ClearErrors',
    '  ${GetOptions} $R1 "--force-run" $R0',
    '  ${IfNot} ${Errors}',
    '    nsis_tauri_utils::RunAsUser "$INSTDIR\\${MAINBINARYNAME}.exe" ""',
    '  ${EndIf}',
    '!macroend',
    '',
  ].join('\n');

export { installerHooks };
