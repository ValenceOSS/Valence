import { runCli } from './runCli';

process.exitCode = runCli(process.argv.slice(2), process.env, {
  say: (line) => {
    process.stdout.write(`${line}\n`);
  },
  complain: (line) => {
    process.stderr.write(`${line}\n`);
  },
});
