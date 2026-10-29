import { migrateDatabase } from '@ValenceMetrics/db/migrateDatabase';
import { openDatabase } from '@ValenceMetrics/db/openDatabase';
import { seedInstalls } from './seedInstalls';
import { seededRandom } from './seededRandom';

const INSTALLS = 60;

await migrateDatabase();

const days = await seedInstalls(openDatabase(), new Date(), INSTALLS, seededRandom(412));

process.stdout.write(
  `Made up ${INSTALLS.toString()} installs and ${days.toString()} daily reports.\n`,
);

process.exit(0);
