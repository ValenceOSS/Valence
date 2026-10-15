import { useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { Callout } from '@ValenceUI/Callout';
import { SettingRow } from '@ValenceUI/SettingRow';
import { testHardware } from '@ValenceClient/admin/testHardware';
import { accelerationOptions } from '@ValenceScreens/components/AdminArea/accelerationOptions';
import type { HardwareTestReport } from '@ValenceContracts/schemas/HardwareTestReport';
import type { HardwareTestProps } from './HardwareTest.types';
import { say } from '@ValenceI18n/say';

/**
 * Names a backend the way the setting above it does.
 *
 * @param accel - The backend, as the media service names it.
 * @returns What to call it.
 */
const nameOf = (accel: string): string =>
  accelerationOptions.find((option) => option.id === accel)?.label ?? accel.toUpperCase();

/**
 * Says plainly what a test found: whether the hardware decoded and encoded, how fast, and why it
 * fell back to software where it did.
 *
 * @param report - What the hardware did.
 * @returns The result, as a callout.
 */
const Outcome = ({ report }: { report: HardwareTestReport }) => {
  const softwareSpeed =
    report.softwareSpeed === null ? null : (
      <p>
        {say('screens.adminArea.hardwareTest.softwareSpeed', {
          speed: report.softwareSpeed.toString(),
        })}
      </p>
    );

  if (report.accel === 'none') {
    return (
      <Callout tone="warning" title={say('screens.adminArea.hardwareTest.inSoftware')}>
        <p>{say('screens.adminArea.hardwareTest.noHardwareEncoder')}</p>
        {softwareSpeed}
      </Callout>
    );
  }

  if (!report.encodesOnDevice) {
    return (
      <Callout
        tone="danger"
        title={say('screens.adminArea.hardwareTest.fellBack', { backend: nameOf(report.accel) })}
      >
        {report.reason === null ? null : <p className="font-mono text-xs">{report.reason}</p>}
        {softwareSpeed}
      </Callout>
    );
  }

  return (
    <Callout
      tone="quiet"
      title={say('screens.adminArea.hardwareTest.isWorking', { backend: nameOf(report.accel) })}
    >
      <ul className="flex flex-col gap-0.5">
        <li>
          {report.decodesOnDevice === true
            ? say('screens.adminArea.hardwareTest.decodedOnDevice')
            : say('screens.adminArea.hardwareTest.decodedInSoftware')}
        </li>
        <li>{say('screens.adminArea.hardwareTest.encodedWith', { encoder: report.encoder })}</li>
        {report.speed === null ? null : (
          <li>{say('screens.adminArea.hardwareTest.speed', { speed: report.speed.toString() })}</li>
        )}
        {report.softwareSpeed === null ? null : (
          <li>
            {say('screens.adminArea.hardwareTest.softwareSpeed', {
              speed: report.softwareSpeed.toString(),
            })}
          </li>
        )}
      </ul>
    </Callout>
  );
};

Outcome.displayName = 'Outcome';

/**
 * A button beside the hardware acceleration setting that tries it on a short real transcode, and
 * what it found, so whether the hardware is in use is something an administrator can see rather
 * than dig out of the logs.
 *
 * @param accel - The backend chosen above, tried as chosen even before it is saved.
 */
const HardwareTest = ({ accel }: HardwareTestProps) => {
  const [isTesting, setIsTesting] = useState(false);
  const [report, setReport] = useState<HardwareTestReport | null>(null);
  const [hasFailed, setHasFailed] = useState(false);

  return (
    <>
      <SettingRow
        title={say('screens.adminArea.hardwareTest.title')}
        description={say('screens.adminArea.hardwareTest.description')}
      >
        <Button
          variant="secondary"
          size="sm"
          disabled={isTesting}
          onClick={() => {
            setIsTesting(true);
            setHasFailed(false);

            void testHardware(accel).then((found) => {
              setIsTesting(false);
              setReport(found);
              setHasFailed(found === null);
            });
          }}
        >
          {isTesting ? say('screens.adminArea.hardwareTest.testing') : say('common.test')}
        </Button>
      </SettingRow>

      {report === null && !hasFailed ? null : (
        <div className="px-4 pb-4" aria-live="polite">
          {report === null ? (
            <Callout tone="danger" title={say('screens.adminArea.hardwareTest.couldNotTest')} />
          ) : (
            <Outcome report={report} />
          )}
        </div>
      )}
    </>
  );
};

HardwareTest.displayName = 'HardwareTest';

export { HardwareTest };
