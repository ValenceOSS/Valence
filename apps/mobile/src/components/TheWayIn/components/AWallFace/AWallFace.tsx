import { Animated, View } from 'react-native';
import { AFace } from '@ValenceMobile/components/AFace/AFace';
import { Button } from '@ValenceMobile/components/Button/Button';
import { useArrivingFrom } from '@ValenceMobile/hooks/useArrivingFrom';
import { say } from '@ValenceI18n/say';
import type { AWallFaceProps } from './AWallFace.types';

/**
 * One face on the wall, which says where it is on the screen when it is picked, so the password
 * can fly it from there, and flies back into its place from the password when somebody comes back.
 *
 * @param profile - Whose face it is.
 * @param arrivingFrom - Where it is flying back from, or nothing where it is simply here.
 * @param onPicked - Told it was picked, and where it was.
 */
const AWallFace = ({ profile, arrivingFrom, onPicked }: AWallFaceProps) => {
  const { placed, onPlaced, flying } = useArrivingFrom(
    () => arrivingFrom,
    arrivingFrom !== null,
    true,
  );

  return (
    <View ref={placed} collapsable={false} onLayout={onPlaced}>
      <Animated.View style={flying}>
        <Button
          tone="bare"
          label={say('phone.aWallFace.signInAs', { name: profile.name })}
          onPress={() => {
            if (placed.current === null) {
              onPicked(profile, null);

              return;
            }

            placed.current.measureInWindow((x, y, width) => {
              onPicked(profile, { x, y, width, height: width });
            });
          }}
        >
          <AFace profile={profile} />
        </Button>
      </Animated.View>
    </View>
  );
};

AWallFace.displayName = 'AWallFace';

export { AWallFace };
