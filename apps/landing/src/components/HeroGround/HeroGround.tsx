import { GradientAscii } from '@ValenceUI/GradientAscii';
import { Logo } from '@ValenceUI/Logo';

/**
 * The ground every hero on getvalence.app stands on: blue light written out in characters, with
 * the mark blown up and cropped off the top right corner, fading away before it reaches the words.
 */
const HeroGround = () => (
  <div aria-hidden className="absolute inset-0 -z-10 bg-aurora">
    <GradientAscii
      gradientOpacity={0.4}
      glyphOpacity={0.45}
      glow={0.1}
      className="absolute inset-0"
    />
    <Logo
      isCurrentColour
      className="valence-hero-mark absolute -right-[14%] -top-[18%] h-[118%] text-accent"
    />
  </div>
);

HeroGround.displayName = 'HeroGround';

export { HeroGround };
