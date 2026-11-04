import { Callout } from '@ValenceUI/Callout';
import { nameOfAccel } from '@ValenceScreens/admin/nameOfAccel';
import type { HardwareTestReport } from '@ValenceContracts/schemas/HardwareTestReport';
import type { HardwareTestResultProps } from './HardwareTestResult.types';
import { say } from '@ValenceI18n/say';

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
        title={say('screens.adminArea.hardwareTest.fellBack', {
          backend: nameOfAccel(report.accel),
        })}
      >
        {report.reason === null ? null : <p className="font-mono text-xs">{report.reason}</p>}
        {softwareSpeed}
      </Callout>
    );
  }

  return (
    <Callout
      tone="quiet"
      title={say('screens.adminArea.hardwareTest.isWorking', {
        backend: nameOfAccel(report.accel),
      })}
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
 * What trying the hardware found, set beneath the hardware setting once a test has run: whether it
 * decoded and encoded on the device and how fast, why it fell back to software, or that the test
 * itself could not run.
 *
 * @param report - What the hardware did, or nothing where no test has answered.
 * @param hasFailed - Whether the test could not run at all.
 */
const HardwareTestResult = ({ report, hasFailed }: HardwareTestResultProps) =>
  report === null && !hasFailed ? null : (
    <div className="pb-4" aria-live="polite">
      {report === null ? (
        <Callout tone="danger" title={say('screens.adminArea.hardwareTest.couldNotTest')} />
      ) : (
        <Outcome report={report} />
      )}
    </div>
  );

HardwareTestResult.displayName = 'HardwareTestResult';

export { HardwareTestResult };
