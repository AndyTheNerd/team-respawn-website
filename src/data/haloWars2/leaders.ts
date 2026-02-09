import type { Leader } from './types';

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
    imageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/leaders/isabel-5e18a5cbb5e34c46ba5e8e681d04f280.png',
  },
  3: {
    id: 3,
    name: 'Anders',
    displayName: 'Professor Anders',
    faction: 'UNSC',
    imageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/leaders/anders-e6f2b733ec7e4ad8b7c5a8d3801b5092.png',
  },
  4: {
    id: 4,
    name: 'Decimus',
    displayName: 'Decimus',
    faction: 'Banished',
    imageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/leaders/decimus-89f3ccd78c6a4a6aab93c9b2e6904178.png',
  },
  5: {
    id: 5,
    name: 'Atriox',
    displayName: 'Atriox',
    faction: 'Banished',
    imageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/leaders/atriox-53e0e9af4c7d4a478da8d0490b0316dd.png',
  },
  6: {
    id: 6,
    name: 'Shipmaster',
    displayName: 'Shipmaster',
    faction: 'Banished',
    imageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/leaders/shipmaster-8e028a69893d4cdf83a7820ae0e34dec.png',
  },
  7: {
    id: 7,
    name: 'Forge',
    displayName: 'Sergeant Forge',
    faction: 'UNSC',
    imageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/leaders/forge-0ff02f3cddc1432a913aef417b5e2222.png',
  },
  8: {
    id: 8,
    name: 'Kinsano',
    displayName: 'Kinsano',
    faction: 'UNSC',
    imageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/leaders/kinsano-40f15cb6ef134ae1aa54c7f91c2f2d56.png',
  },
  9: {
    id: 9,
    name: 'Jerome',
    displayName: 'Commander Jerome',
    faction: 'UNSC',
    imageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/leaders/jerome-1dc0c3fa1e59402e82a53f62d86e50da.png',
  },
  10: {
    id: 10,
    name: 'Arbiter',
    displayName: 'The Arbiter',
    faction: 'Banished',
    imageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/leaders/arbiter-46d7bc41bb8746eca0c2c8804db74a95.png',
  },
  11: {
    id: 11,
    name: 'Colony',
    displayName: 'Colony',
    faction: 'Banished',
    imageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/leaders/colony-ad2b2c14abdf4e84b3e0b83d5deec116.png',
  },
  12: {
    id: 12,
    name: 'YapYap',
    displayName: 'Yapyap THE DESTROYER',
    faction: 'Banished',
    imageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/leaders/yapyap-54ccfeb2da314ea98a2753d23cc5d1d5.png',
  },
  13: {
    id: 13,
    name: 'Voridus',
    displayName: 'Voridus',
    faction: 'Banished',
    imageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/leaders/voridus-8c10ca1d3ec343dfa5aaa64df8b64fc1.png',
  },
  14: {
    id: 14,
    name: 'Pavium',
    displayName: 'Pavium',
    faction: 'Banished',
    imageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/leaders/pavium-d3a7e3b024e14dc6a9b0f74c44519ee4.png',
  },
  15: {
    id: 15,
    name: 'Serina',
    displayName: 'Serina',
    faction: 'UNSC',
    imageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/leaders/serina-70de2953b1264e9d8b9a5b91d26e09b8.png',
  },
  16: {
    id: 16,
    name: 'Johnson',
    displayName: 'Sergeant Johnson',
    faction: 'UNSC',
    imageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/leaders/johnson-0acbe252a53b4db2bf9cb7f72bd0dbcc.png',
  },
};

export function getLeaderName(leaderId: number): string {
  return leaderData[leaderId]?.displayName || `Leader ${leaderId}`;
}

export function getLeaderFaction(leaderId: number): 'UNSC' | 'Banished' {
  return leaderData[leaderId]?.faction || 'UNSC';
}
