import { ArrowRight as ArrowRightIcon } from '@keyline-icons/react';
import { DataTable } from '@ValenceUI/DataTable';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import { Icon } from '@ValenceUI/Icon';
import { Link } from '@ValenceUI/Link';
import { PageHero } from '@ValenceUI/PageHero';
import { SectionCard } from '@ValenceUI/SectionCard';
import { GetStarted } from '@ValenceLanding/components/HomePage/components/GetStarted/GetStarted';
import { MachineCard } from '@ValenceLanding/components/RequirementsPage/components/MachineCard/MachineCard';
import { DOCS_URL } from '@ValenceLanding/content/DOCS_URL';
import { MACHINES } from '@ValenceLanding/content/requirements/MACHINES';
import { SERVER_SPECS } from '@ValenceLanding/content/requirements/SERVER_SPECS';

const SPEC_COLUMNS: DataTableColumn<(typeof SERVER_SPECS)[number]>[] = [
  {
    id: 'resource',
    header: 'Resource',
    accessorFn: (spec) => spec.resource,
    cell: ({ row }) => <span className="font-semibold text-text">{row.original.resource}</span>,
  },
  {
    id: 'least',
    header: 'At the least',
    accessorFn: (spec) => spec.least,
    enableSorting: false,
    cell: ({ row }) => <span className="block min-w-48 text-text">{row.original.least}</span>,
  },
  {
    id: 'comfortable',
    header: 'Comfortable',
    accessorFn: (spec) => spec.comfortable,
    enableSorting: false,
    cell: ({ row }) => <span className="block min-w-48 text-text">{row.original.comfortable}</span>,
  },
  {
    id: 'note',
    header: 'Why',
    accessorFn: (spec) => spec.note,
    enableSorting: false,
    meta: { fills: true },
    cell: ({ row }) => <span className="block text-text-muted">{row.original.note}</span>,
  },
];

const EYEBROW = 'font-mono text-xs uppercase tracking-[0.14em] text-accent';

const SECTION = 'mx-auto flex max-w-6xl flex-col gap-8 px-5 py-16 sm:px-10 sm:py-20 xl:max-w-7xl';

/**
 * What to run Valence on, told through the machines people actually have: an Intel mini PC, a NAS,
 * a graphics card from each maker, a Mac, a Windows PC, a machine with no graphics and an ARM
 * board, each saying how Valence uses its graphics and how far it works today. Then what a server
 * needs at the least and to be comfortable, and the software around it.
 */
const RequirementsPage = () => (
  <>
    <PageHero
      eyebrow="Requirements"
      lead="What should run"
      accent="your"
      trail="Valence?"
      description="Most homes need less than they think. A small machine that plays files directly can serve the whole house; graphics only matter for the streams that need converting."
    />

    <SectionCard>
      <section aria-labelledby="machines" className={SECTION}>
        <div className="flex max-w-2xl flex-col gap-3">
          <p className={EYEBROW}>Real machines</p>
          <h2 id="machines" className="text-4xl font-semibold tracking-headline text-text">
            What people run it on.
          </h2>
          <p className="text-pretty text-text-muted">
            Valence runs as a Docker Compose stack on x86-64, with its own FFmpeg and its own Intel
            and AMD drivers inside the image. How a machine’s graphics are used depends on the
            machine.
          </p>
        </div>

        <div className="grid gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60 md:grid-cols-2 xl:grid-cols-3">
          {MACHINES.map((machine) => (
            <MachineCard key={machine.id} machine={machine} />
          ))}
        </div>
      </section>
    </SectionCard>

    <SectionCard>
      <section aria-labelledby="sizing" className={SECTION}>
        <div className="flex max-w-2xl flex-col gap-3">
          <p className={EYEBROW}>Sizing</p>
          <h2 id="sizing" className="text-4xl font-semibold tracking-headline text-text">
            What a server needs.
          </h2>
          <p className="text-pretty text-text-muted">
            These are recommendations, not limits Valence checks. How many people stream at once,
            and whether their devices need transcodes, matters far more than the size of the
            library.
          </p>
        </div>

        <DataTable
          label="What a server needs"
          columns={SPEC_COLUMNS}
          rows={[...SERVER_SPECS]}
          getRowId={(spec) => spec.resource}
          pageSize={SERVER_SPECS.length}
          height="parent"
        />

        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-2 rounded-2xl border border-border/60 p-5">
            <h3 className="font-semibold text-text">Docker and Compose</h3>
            <p className="text-sm leading-relaxed text-text-muted">
              Docker Engine with the Compose plugin. The image is built for linux/amd64 and carries
              its own FFmpeg, so the host needs nothing else.
            </p>
          </div>
          <div className="flex flex-col gap-2 rounded-2xl border border-border/60 p-5">
            <h3 className="font-semibold text-text">A database</h3>
            <p className="text-sm leading-relaxed text-text-muted">
              Postgres 15 or newer, which the compose file runs for you. MySQL 8.0.21 or newer and
              MariaDB 10.6 or newer work too.
            </p>
          </div>
          <div className="flex flex-col gap-2 rounded-2xl border border-border/60 p-5">
            <h3 className="font-semibold text-text">HTTPS</h3>
            <p className="text-sm leading-relaxed text-text-muted">
              A reverse proxy or tunnel in front. Passkeys and secure cookies need a secure address,
              so plain HTTP is only for trying it out.
            </p>
          </div>
        </div>

        <Link
          href={`${DOCS_URL}/start/system-requirements`}
          className="inline-flex items-center gap-1 self-start text-sm font-semibold text-text-muted no-underline hover:text-text"
        >
          The full system requirements
          <Icon of={ArrowRightIcon} size={14} />
        </Link>
      </section>
    </SectionCard>

    <GetStarted />
  </>
);

RequirementsPage.displayName = 'RequirementsPage';

export { RequirementsPage };
