import type { Leader } from './types';

const CLOUDINARY_CLOUD_NAME = (() => {
  const envName = import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (envName) return envName;
  if (typeof window !== 'undefined') {
    const globalName = (window as typeof window & { __CLOUDINARY_CLOUD_NAME__?: string }).__CLOUDINARY_CLOUD_NAME__;
    if (typeof globalName === 'string' && globalName.length > 0) return globalName;
  }
  return '';
})();
const CLOUDINARY_TRANSFORMS = 'f_auto,q_auto';

function buildCloudinaryFetchUrl(sourceUrl?: string): string {
  if (!CLOUDINARY_CLOUD_NAME || !sourceUrl) return '';
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/fetch/${CLOUDINARY_TRANSFORMS}/${encodeURIComponent(sourceUrl)}`;
}

export const leaderData: Record<number, Leader> = {
  1: {
    id: 1,
    name: 'Cutter',
    displayName: 'Captain Cutter',
    faction: 'UNSC',
    imageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/leaders/cutter-4847987df416401a83970ed9dbd9d036.png',
  },
  2: {
    id: 2,
    name: 'Isabel',
    displayName: 'Isabel',
    faction: 'UNSC',
    imageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/leaders/isabel-dd34772cbd6d4db6bef49d3e1d5c6d43.png',
    fallbackImageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/leaders/isabel-5e18a5cbb5e34c46ba5e8e681d04f280.png',
  },
  3: {
    id: 3,
    name: 'Anders',
    displayName: 'Professor Anders',
    faction: 'UNSC',
    imageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/leaders/anders-0d9b72aa7a9a4831a06ee2f1f4fa5ece.png',
    fallbackImageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/leaders/anders-e6f2b733ec7e4ad8b7c5a8d3801b5092.png',
  },
  4: {
    id: 4,
    name: 'Decimus',
    displayName: 'Decimus',
    faction: 'Banished',
    imageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/leaders/decimus-f0858672e88a4750b817164402a03d0d.png',
    fallbackImageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/leaders/decimus-89f3ccd78c6a4a6aab93c9b2e6904178.png',
  },
  5: {
    id: 5,
    name: 'Atriox',
    displayName: 'Atriox',
    faction: 'Banished',
    imageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/leaders/atriox-bf79c35d8b7b41579806c2fa3ea6706e.png',
    fallbackImageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/leaders/atriox-53e0e9af4c7d4a478da8d0490b0316dd.png',
  },
  6: {
    id: 6,
    name: 'Shipmaster',
    displayName: 'Shipmaster',
    faction: 'Banished',
    imageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/leaders/shipmaster-342c9c4fe0fb439bb6a3dbc89ed8a842.png',
    fallbackImageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/leaders/shipmaster-8e028a69893d4cdf83a7820ae0e34dec.png',
  },
  7: {
    id: 7,
    name: 'Forge',
    displayName: 'Sergeant Forge',
    faction: 'UNSC',
    imageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/leaders/forge-acba0f49983841789a72dd6d53d5a09c.png',
    fallbackImageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/leaders/forge-0ff02f3cddc1432a913aef417b5e2222.png',
  },
  8: {
    id: 8,
    name: 'Kinsano',
    displayName: 'Kinsano',
    faction: 'UNSC',
    imageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/leaders/kisano-92cdaa76c8304ce5955352f9af5a5ece.png',
    fallbackImageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/leaders/kinsano-40f15cb6ef134ae1aa54c7f91c2f2d56.png',
  },
  9: {
    id: 9,
    name: 'Jerome',
    displayName: 'Commander Jerome',
    faction: 'UNSC',
    imageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/leaders/jerome-cropped-8d3953455fba403fa0b323debfbe55f6.png',
    fallbackImageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/leaders/jerome-1dc0c3fa1e59402e82a53f62d86e50da.png',
  },
  10: {
    id: 10,
    name: 'Arbiter',
    displayName: 'The Arbiter',
    faction: 'Banished',
    imageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/leaders/arbiter-ripa-moramee-cropped-ed512f910d0b4f9d9563c94bda2f9b70.png',
    fallbackImageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/leaders/arbiter-46d7bc41bb8746eca0c2c8804db74a95.png',
  },
  11: {
    id: 11,
    name: 'Colony',
    displayName: 'Colony',
    faction: 'Banished',
    imageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/leaders/colony-cutout-3-5414bcf8c05b4c2e86e046b95c9e8734.png',
    fallbackImageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/leaders/colony-ad2b2c14abdf4e84b3e0b83d5deec116.png',
  },
  12: {
    id: 12,
    name: 'YapYap',
    displayName: 'Yapyap THE DESTROYER',
    faction: 'Banished',
    imageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/leaders/yapyap-f986fa8a011a4eb494ba030a9cbbd215.png',
    fallbackImageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/leaders/yapyap-54ccfeb2da314ea98a2753d23cc5d1d5.png',
  },
  13: {
    id: 13,
    name: 'Voridus',
    displayName: 'Voridus',
    faction: 'Banished',
    imageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/leaders/leader-image-voridus-66b7848eac754c739f1825174ac27539.png',
    fallbackImageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/leaders/voridus-8c10ca1d3ec343dfa5aaa64df8b64fc1.png',
  },
  14: {
    id: 14,
    name: 'Pavium',
    displayName: 'Pavium',
    faction: 'Banished',
    imageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/leaders/leader-image-pavium-94fe439dc91844f3b9c6a58f0b56042d.png',
    fallbackImageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/leaders/pavium-d3a7e3b024e14dc6a9b0f74c44519ee4.png',
  },
  15: {
    id: 15,
    name: 'Serina',
    displayName: 'Serina',
    faction: 'UNSC',
    imageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/leaders/serena-crop-b424289b35fd4903a63432e55be81109.png',
    fallbackImageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/leaders/serina-70de2953b1264e9d8b9a5b91d26e09b8.png',
  },
  16: {
    id: 16,
    name: 'Johnson',
    displayName: 'Sergeant Johnson',
    faction: 'UNSC',
    imageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/leaders/hw2-leader-crop-johnson-2978545f84b54ece8efef7af4d6600e1.png',
    fallbackImageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/leaders/johnson-0acbe252a53b4db2bf9cb7f72bd0dbcc.png',
  },
};

export function getLeaderName(leaderId: number): string {
  return leaderData[leaderId]?.displayName || `Leader ${leaderId}`;
}

export function getLeaderFaction(leaderId: number): 'UNSC' | 'Banished' {
  return leaderData[leaderId]?.faction || 'UNSC';
}

export function getLeaderImage(leaderId: number): string {
  const leader = leaderData[leaderId];
  if (!leader) return '';
  const cloudinary = buildCloudinaryFetchUrl(leader.imageUrl);
  return cloudinary || leader.imageUrl || '';
}

export function getLeaderImageFallback(leaderId: number): string {
  const leader = leaderData[leaderId];
  if (!leader) return '';
  return leader.fallbackImageUrl || leader.imageUrl || '';
}
