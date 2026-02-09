import type { HaloMap } from './types';

export const mapData: Record<string, HaloMap> = {
  'skirmish\\design\\fort_jordan\\fort_jordan': {
    id: 'skirmish\\design\\fort_jordan\\fort_jordan',
    name: 'Fort Jordan',
    imageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/maps/hw2-map-fort_jordan-18ef39c3707e4f7698c479066f59c504.jpg',
  },
  'rostermode\\design\\RM_EvenFlowNight\\RM_EvenFlowNight': {
    id: 'rostermode\\design\\RM_EvenFlowNight\\RM_EvenFlowNight',
    name: 'Nocturne',
    imageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/maps/[ui]loadingscreen_dlc_blitz_night-d201db4848fb49bbae935da6f292536f.jpg',
  },
  'rostermode\\design\\RM_EvenFlow_Desert\\RM_EvenFlow_Desert': {
    id: 'rostermode\\design\\RM_EvenFlow_Desert\\RM_EvenFlow_Desert',
    name: 'Sirocco',
    imageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/maps/[ui]loadingscreen_dlc_blitz_sirocco-ce31e96ebda343d08e68a503ec23c208.jpg',
  },
  'skirmish\\design\\Ep02_M03\\Ep02_M03': {
    id: 'skirmish\\design\\Ep02_M03\\Ep02_M03',
    name: 'Fissures',
    imageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/maps/[ui]loadingscreen_dlc_multiplayer-map-02-9d931fa066264592bdf08657aea1cb2c.jpg',
  },
  'skirmish\\design\\MC_EnforcerValley\\MC_EnforcerValley': {
    id: 'skirmish\\design\\MC_EnforcerValley\\MC_EnforcerValley',
    name: 'Mirage',
    imageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/maps/[ui]loadingscreen_dlc_mirage-a768755467aa4f78b4509003e341b17e.jpg',
  },
  'skirmish\\design\\FF_StopTheSignal\\FF_StopTheSignal': {
    id: 'skirmish\\design\\FF_StopTheSignal\\FF_StopTheSignal',
    name: 'High Bastion',
    imageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/maps/map-badlands-fa971bd11a1742a9b12ea48f9923bd8a.jpg',
  },
  'skirmish\\design\\MP_Eagle\\MP_Eagle': {
    id: 'skirmish\\design\\MP_Eagle\\MP_Eagle',
    name: 'Badlands',
    imageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/maps/map-badlands-fa971bd11a1742a9b12ea48f9923bd8a.jpg',
  },
  'skirmish\\design\\MP_Bridges\\MP_Bridges': {
    id: 'skirmish\\design\\MP_Bridges\\MP_Bridges',
    name: 'Frontier',
    imageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/maps/map-frontier-4116c5c6e92e41e1907e3b793252d4b1.jpg',
  },
  'skirmish\\design\\MP_Razorblade\\MP_Razorblade': {
    id: 'skirmish\\design\\MP_Razorblade\\MP_Razorblade',
    name: 'Bedrock',
    imageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/maps/map-bedrock-c355271b7c3e4deaa9cfff82f83912b5.jpg',
  },
  'skirmish\\design\\MP_Ricochet\\MP_Ricochet': {
    id: 'skirmish\\design\\MP_Ricochet\\MP_Ricochet',
    name: 'Sentry',
    imageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/maps/map-sentry-61578c54366b4bf4ba2d57463eb4755e.jpg',
  },
  'skirmish\\design\\MP_Caldera\\MP_Caldera': {
    id: 'skirmish\\design\\MP_Caldera\\MP_Caldera',
    name: 'Ashes',
    imageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/maps/map-ashes-8b873f87136c4f5d8a94430f3b6e71cc.jpg',
  },
  'skirmish\\design\\MP_Boneyard\\MP_Boneyard': {
    id: 'skirmish\\design\\MP_Boneyard\\MP_Boneyard',
    name: 'Highway',
    imageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/maps/map-highway-4b520db7dfdc4d7b867ec8c93f941dd3.jpg',
  },
  'skirmish\\design\\MP_Veteran\\MP_Veteran': {
    id: 'skirmish\\design\\MP_Veteran\\MP_Veteran',
    name: 'Vault',
    imageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/maps/map-vault-6c77ee46379b4ddba1602bdfa77b7768.jpg',
  },
  'rostermode\\design\\RM_EvenFlowArt\\RM_EvenFlowArt': {
    id: 'rostermode\\design\\RM_EvenFlowArt\\RM_EvenFlowArt',
    name: 'The Proving Grounds',
    imageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/maps/hw2-map-blitz-f43c6b132b174b03a22f554de341f6a7.jpg',
  },
  'skirmish\\design\\MP_Fracture\\MP_Fracture': {
    id: 'skirmish\\design\\MP_Fracture\\MP_Fracture',
    name: 'Rift',
    imageUrl: 'https://content.halocdn.com/media/Default/games/halo-wars-2/maps/hw2-map-fracture-1c4c021b240146279f4d21d27e2970c2.jpg',
  },
};

export function getMapName(mapId: string): string {
  return mapData[mapId]?.name || mapId.split('\\').pop() || 'Unknown Map';
}

export function getMapImage(mapId: string): string {
  return mapData[mapId]?.imageUrl || '';
}
