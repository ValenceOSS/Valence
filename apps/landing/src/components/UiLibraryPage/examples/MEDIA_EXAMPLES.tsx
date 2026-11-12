import { Bell, Check, Film, Heart, Search, Star } from '@keyline-icons/react';
import { ArtCard } from '@ValenceUI/ArtCard';
import { createRef } from 'react';
import { BackdropScrim } from '@ValenceUI/BackdropScrim';
import { BrandGlyph } from '@ValenceUI/BrandGlyph';
import { DiscordStatusCard } from '@ValenceUI/DiscordStatusCard';
import { OriginMark } from '@ValenceUI/OriginMark';
import { CountMark } from '@ValenceUI/CountMark';
import { PictureCanvas } from '@ValenceUI/PictureCanvas';
import { ROLE_COLOURS } from '@ValenceUI/tokens/roleColours';
import { Icon } from '@ValenceUI/Icon';
import { Logo } from '@ValenceUI/Logo';
import { MediaCard } from '@ValenceUI/MediaCard';
import { NavBar } from '@ValenceUI/NavBar';
import { QrCode } from '@ValenceUI/QrCode';
import { Rail } from '@ValenceUI/Rail';
import { VideoSurfaceDemo } from '@ValenceLanding/components/UiLibraryPage/examples/demos/VideoSurfaceDemo';
import { EmbeddedVideo } from '@ValenceUI/EmbeddedVideo';
import { ReaderVignette } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/ReaderVignette/ReaderVignette';
import { DeckMark } from '@ValenceUI/DeckMark';
import type { UiExample } from './UiExample.types';

const ART = '/valence.jpg';

const WIDE_ART = '/downloads-header.jpg';

const nothing = () => undefined;

const MEDIA_EXAMPLES: Readonly<Record<string, readonly UiExample[]>> = {
  MediaCard: [
    {
      title: 'Shapes',
      render: () => (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MediaCard title="Poster" subtitle="2026" imageUrl={ART} onSelect={nothing} />
          <MediaCard
            title="Book"
            subtitle="Its author"
            imageUrl={ART}
            shape="book"
            onSelect={nothing}
          />
          <div className="col-span-2">
            <MediaCard
              title="Wide"
              subtitle="Season 1"
              imageUrl={WIDE_ART}
              shape="wide"
              onSelect={nothing}
            />
          </div>
        </div>
      ),
    },
    {
      title: 'States',
      render: () => (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MediaCard
            title="Part watched"
            subtitle="1h 12m left"
            imageUrl={ART}
            watchedFraction={0.4}
            onSelect={nothing}
          />
          <MediaCard
            title="Watched"
            subtitle="2024"
            imageUrl={ART}
            watchedFraction={1}
            onSelect={nothing}
          />
          <MediaCard
            title="With badges"
            subtitle="2018"
            imageUrl={ART}
            badges={['4K', 'Dolby Vision']}
            corner={{ icon: Check, label: 'Watched' }}
            onSelect={nothing}
          />
          <MediaCard
            title="No artwork"
            subtitle="Unknown"
            count={11}
            countLabel="11 new episodes"
            onSelect={nothing}
          />
        </div>
      ),
    },
  ],
  ArtCard: [
    {
      title: 'Flag and progress',
      render: () => (
        <div className="grid gap-4 sm:grid-cols-2">
          <ArtCard
            title="Recently added"
            imageUrl={WIDE_ART}
            flag="Recently added"
            onSelect={nothing}
          />
          <ArtCard
            title="Carrying on"
            imageUrl={WIDE_ART}
            watchedFraction={0.55}
            onSelect={nothing}
          />
        </div>
      ),
    },
  ],
  Rail: [
    {
      title: 'A row of cards',
      render: () => (
        <Rail title="Picked for you" count={6} cards="portrait" hasArrows>
          {Array.from({ length: 6 }, (_, at) => (
            <MediaCard
              key={at}
              title={`Title ${(at + 1).toString()}`}
              subtitle="2026"
              imageUrl={ART}
              onSelect={nothing}
            />
          ))}
        </Rail>
      ),
    },
  ],
  Logo: [
    {
      title: 'Sizes and looks',
      render: () => (
        <div className="flex items-center gap-6">
          <Logo size={24} />
          <Logo size={40} />
          <Logo size={56} isSolid />
          <Logo size={56} isDotted />
        </div>
      ),
    },
  ],
  DeckMark: [
    {
      title: 'The deck, fanning out as it arrives',
      render: () => <DeckMark size={96} isAnimated label="Valence" />,
    },
  ],
  Icon: [
    {
      title: 'Tones',
      render: () => (
        <div className="flex items-center gap-4">
          {(['strong', 'muted', 'faint', 'success', 'danger'] as const).map((tone) => (
            <Icon key={tone} of={Star} size={22} tone={tone} label={tone} />
          ))}
          <Icon of={Heart} whenActive={Heart} isActive size={22} label="Active" />
        </div>
      ),
    },
  ],
  QrCode: [
    {
      title: 'An address',
      render: () => <QrCode value="https://getvalence.app" label="The Valence site" size={140} />,
    },
  ],
  BackdropScrim: [
    {
      title: 'Over artwork',
      render: () => (
        <div className="relative h-40 overflow-hidden rounded-xl">
          <img src={WIDE_ART} alt="" className="absolute inset-0 size-full object-cover" />
          <BackdropScrim />
          <p className="absolute bottom-4 left-4 text-lg font-semibold text-on-scrim">
            Readable over any picture
          </p>
        </div>
      ),
    },
  ],
  NavBar: [
    {
      title: 'Places and tools',
      render: () => (
        <div className="relative h-20 overflow-hidden rounded-xl">
          <NavBar
            className="absolute"
            brand={<Logo size={24} />}
            items={[
              { id: 'home', label: 'Home' },
              { id: 'films', label: 'Films', icon: <Icon of={Film} size={16} /> },
            ]}
            selectedId="home"
            onSelect={nothing}
            actions={[
              {
                id: 'search',
                label: 'Search',
                icon: <Icon of={Search} size={18} />,
                onSelect: nothing,
              },
              {
                id: 'bell',
                label: 'Notifications',
                icon: <Icon of={Bell} size={18} />,
                onSelect: nothing,
              },
            ]}
          />
        </div>
      ),
    },
  ],
  VideoSurface: [
    {
      title: 'Waiting on its poster',
      render: () => <VideoSurfaceDemo />,
    },
  ],
  EmbeddedVideo: [
    {
      title: 'A trailer from a video host',
      render: () => (
        <div className="w-full max-w-xl overflow-hidden rounded-xl">
          <EmbeddedVideo
            label="An open-licence short film"
            src="https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ"
          />
        </div>
      ),
    },
  ],
  PageCurl: [
    {
      title: 'Turns by itself, or drag the page',
      render: () => (
        <div className="w-full max-w-md">
          <ReaderVignette />
        </div>
      ),
    },
  ],
  BrandGlyph: [
    {
      title: 'Platforms and browsers',
      render: () => (
        <div className="flex flex-wrap items-center gap-3 text-text">
          {(
            [
              'apple',
              'android',
              'windows',
              'linux',
              'chrome',
              'firefox',
              'safari',
              'valence',
            ] as const
          ).map((name) => (
            <BrandGlyph key={name} of={name} size={22} label={name} />
          ))}
        </div>
      ),
    },
  ],
  OriginMark: [
    {
      title: 'Where a title comes from',
      render: () => (
        <div className="flex items-center gap-3">
          <OriginMark
            initial="L"
            colour={ROLE_COLOURS[2]}
            ink="light"
            label="From the loft server"
          />
          <OriginMark
            initial="C"
            colour={ROLE_COLOURS[6]}
            ink="dark"
            label="From the cabin server"
          />
        </div>
      ),
    },
  ],
  CountMark: [
    {
      title: 'How many more than a row of marks draws',
      render: () => (
        <div className="flex -space-x-2">
          <OriginMark
            initial="L"
            colour={ROLE_COLOURS[2]}
            ink="light"
            label="From the loft server"
            className="ring-2 ring-shade"
          />
          <OriginMark
            initial="C"
            colour={ROLE_COLOURS[6]}
            ink="dark"
            label="From the cabin server"
            className="ring-2 ring-shade"
          />
          <CountMark count={3} label="3 more servers have it" className="ring-2 ring-shade" />
        </div>
      ),
    },
  ],
  PictureCanvas: [
    {
      title: 'The surface a player draws frames onto, empty here',
      render: () => (
        <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-xl bg-[var(--surface-hover)] [container-type:size]">
          <PictureCanvas canvasRef={createRef<HTMLCanvasElement>()} isShown aspectRatio={16 / 9} />
        </div>
      ),
    },
  ],
  DiscordStatusCard: [
    {
      title: 'What Discord shows while something plays',
      render: () => (
        <DiscordStatusCard
          heading="Valence"
          details="Watching a film"
          state="Part of a series"
          largeImage={ART}
          largeImageLabel="Its poster"
          smallImage="/valence-icon.png"
          smallImageLabel="Valence"
          time={{ kind: 'progress', elapsed: '42:10', total: '1:58:00', fraction: 0.36 }}
          buttons={['Watch on Valence']}
        />
      ),
    },
  ],
};

export { MEDIA_EXAMPLES };
