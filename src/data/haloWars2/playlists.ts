import type { Playlist } from './types';

export const playlistData: Record<string, Playlist> = {
  '548d864e-8666-430e-9140-8dd2ad8fbfcd': {
    id: '548d864e-8666-430e-9140-8dd2ad8fbfcd',
    name: '1v1_ranked',
    displayName: '1v1 Ranked',
  },
  '379f9ee5-92ec-45d9-b5e5-9f30236cab00': {
    id: '379f9ee5-92ec-45d9-b5e5-9f30236cab00',
    name: '2v2_ranked',
    displayName: '2v2 Ranked',
  },
  '4a2cedcc-9098-4728-886f-60649896278d': {
    id: '4a2cedcc-9098-4728-886f-60649896278d',
    name: '3v3_ranked',
    displayName: '3v3 Ranked',
  },
};

export function getPlaylistName(playlistId: string): string {
  return playlistData[playlistId]?.displayName || '';
}
