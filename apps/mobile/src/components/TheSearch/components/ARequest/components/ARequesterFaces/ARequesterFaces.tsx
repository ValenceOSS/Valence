import { StyleSheet, View } from 'react-native';
import { profileInitial } from '@ValenceContracts/schemas/ViewerProfile';
import { thePictureFor } from '@ValenceMobile/components/AFace/thePictureFor';
import { ATabFace } from '@ValenceMobile/components/TheTabs/components/ATabFace/ATabFace';
import type { ARequesterFacesProps } from './ARequesterFaces.types';

const AT_MOST = 3;

const RING = 2;

const OVERLAP = -8;

const NOBODY_S_COLOUR = '#636366';

const styles = StyleSheet.create({
  face: { borderRadius: 999, borderWidth: RING },
  faces: { flexDirection: 'row' },
  over: { marginLeft: OVERLAP },
});

/**
 * Whoever asked for something, as their faces overlapping in a short row, the first asker first:
 * their profile's picture or initial where their face is known, and the first letter of their name
 * on grey where it is not. Each is ringed in the colour of what they sit on, so the faces read
 * apart where they overlap.
 *
 * @param askers - Who asked.
 * @param faces - Every face on this server, to find each asker's in.
 * @param ring - The colour of what they sit on.
 */
const ARequesterFaces = ({ askers, faces, ring }: ARequesterFacesProps) => (
  <View style={styles.faces}>
    {askers.slice(0, AT_MOST).map((asker, at) => {
      const profile = faces.find((one) => one.id === asker.faceProfileId);
      const name = asker.askingProfile?.name ?? asker.name;

      return (
        <View
          key={`${asker.id}/${asker.askingProfile?.profileId ?? ''}`}
          style={[styles.face, at === 0 ? null : styles.over, { borderColor: ring }]}
        >
          <ATabFace
            isShowing={false}
            face={
              profile === undefined
                ? { picture: null, backdrop: NOBODY_S_COLOUR, initial: profileInitial(name) }
                : {
                    picture: thePictureFor(profile),
                    backdrop: profile.colour,
                    initial: profileInitial(profile.name),
                  }
            }
          />
        </View>
      );
    })}
  </View>
);

ARequesterFaces.displayName = 'ARequesterFaces';

export { ARequesterFaces };
