import { hw2NameMappings } from './nameMappings';
import { officialUnitIconById } from './unitIcons.generated';

const gameObjectIconAliases: Record<string, string> = {
  'cov_bldg_grunt_shadeturret_01': 'cov_bldg_turret_01',
  'cov_bldg_grunt_shield_01': 'cov_bldg_shieldtower_01',
  'cov_bldg_grunt_shield_02': 'cov_bldg_shieldtower_01',
  'cov_bldg_grunt_shieldtower_01': 'cov_bldg_shieldtower_01',
  'cov_bldg_grunt_shieldtower_02': 'cov_bldg_shieldtower_01',
  'cov_inf_generic_brutejumppack': 'cov_inf_brutejumppack_01',
  'cov_inf_generic_grunt': 'cov_inf_grunt_01',
  'cov_inf_generic_heavygrunt': 'cov_inf_heavygrunt_01',
  'cov_inf_generic_suicidegrunt': 'cov_inf_suicidegrunt_01',
  'cov_inf_generic_arbitergruntsquad': 'cov_inf_grunt_01',
  'cov_inf_generic_arbiterenforcer': 'cov_inf_elitecommando_01',
  'cov_inf_bruterider_01': 'cov_inf_gruntrebellion_bruterider_01',
  'cov_inf_gruntgoblin01': 'cov_inf_gruntrebellion_goblin_01',
  'cov_inf_gruntswarm_01': 'cov_inf_gruntrebellion_gruntswarm_01',
  'cov_inf_gruntswarm_01_frommine': 'cov_inf_gruntrebellion_gruntswarm_01',
  'cov_air_spiritgunship_01': 'cov_air_banshee_01',
  'cov_veh_grunt_methanewagon_01': 'cov_veh_mathanewagon_01',
  'pow_gp_scatterbombdummy_01': 'questionmark',
  'pow_for_andersultimate_01': 'questionmark',
  'pow_for_arkcleanse_01': 'questionmark',
  'pow_for_lurebeacon_01': 'questionmark',
  'pow_gp_methanebombdummy_01': 'questionmark',
  'fx_mine_plasma_01': 'questionmark',
  'fx_mine_plasma_01_mp': 'questionmark',
  'fx_mine_corruption_01': 'questionmark',
  'fx_mine_ambushmine_01': 'questionmark',
  'fx_mine_ambushmine_02': 'questionmark',
  'fx_mine_arbiter_stasismine_01': 'questionmark',
  'fx_mine_lotus_01_mp': 'questionmark',
  'fx_mine_rcontrolmine_01': 'questionmark',
  'fx_mine_victory_01': 'questionmark',
  'cov_bldg_heavyfactory_01': 'cov_bldg_lightfactory_01',
  'cov_bldg_unbreakablemegaturret_01': 'cov_bldg_megaturret_01',
  'cov_inf_arbiter_assaultteam_02': 'cov_inf_arbiter_assaultteam_01',
  'dlc3_pack2_units_covenant_structure_lekgolowall': 'cov_bldg_shieldtower_01',
  'neutralfor_sentineltier_2_generic': 'for_air_sentineltier2_01',
  'for_air_sentinel_01': 'for_air_sentineltier1_01',
  'unsc_air_forgedrone_01': 'questionmark',
  'unsc_air_pelicangunship_01': 'questionmark',
  'unsc_air_serina_pegasus_01': 'unsc_air_pegasus_01',
  'unsc_bldg_dropturret_01': 'unscturretdrop1',
  'unsc_bldg_johnsonbunker_01': 'questionmark',
  'unsc_bldg_johnsonbunker_02': 'questionmark',
  'unsc_bldg_johnsonbunker_01_mp': 'questionmark',
  'unsc_bldg_johnsonbunker_02_mp': 'questionmark',
  'unsc_bldg_serina_iceblock_01': 'questionmark',
  'unsc_bldg_serina_iceblock_02': 'questionmark',
  'unsc_bldg_siegedropturret_01': 'unsc_bldg_siegegun_01',
  'unsc_bldg_siegedropturret_02': 'unsc_bldg_siegegun_01',
  'unsc_bldg_turretai_01': 'unsc_bldg_antiinfantryturret_01',
  'unsc_bldg_turretaa_01': 'unsc_bldg_antiairturret_01',
  'unsc_bldg_turretav_01': 'unsc_bldg_antivehicleturret_01',
  'unsc_bldg_victoryturret_01': 'unsc_bldg_turret_01',
  'unsc_bldg_supplypad_01': 'unsc_bldg_supplypad_01',
  'unsc_bldg_supplypad_02': 'unsc_bldg_supplypad_02',
  'unsc_bldg_reactor_01': 'unsc_bldg_reactor_01',
  'unsc_bldg_reactor_02': 'unsc_bldg_reactor_02',
  'unsc_inf_flamecyclops_01': 'unsc_inf_cyclops_01',
  'unsc_inf_flamemarine_01': 'unsc_inf_flamemarine_01',
  'unsc_inf_generic_marine': 'unsc_inf_marine_01',
  'unsc_inf_odst_01': 'unsc_inf_odst',
  'unsc_inf_spartan_mpalice_01': 'unsc_inf_spartan_chaingun_01',
  'unsc_inf_serina_cryomarines_01': 'unsc_inf_cryomarines_01',
  'unsc_inf_spartan_mpdoug_01': 'unsc_inf_spartan_rocket_01',
  'unsc_inf_spartan_mpjerome_01': 'unsc_inf_spartan_laser_01_upgrade2',
  'unsc_veh_jerome_mantis_01': 'unsc_veh_rm_mantis_02',
  'unsc_veh_johnson_mantis_01': 'unsc_veh_rm_mantis_02',
  'unsc_veh_mongoose_01': 'questionmark',
  'omegateam_august_01': 'unsc_inf_omegateamaugust_01',
  'unsc_inf_omegateam_leon_01': 'unsc_inf_omegateamleon_01',
  'unsc_inf_omegateam_robert_01': 'unsc_inf_omegateamrobert_01',
  'unsc_inf_omegateam_jerome_01': 'unsc_inf_spartan_laser_01_upgrade2',
  'unsc_veh_serina_hero_01': 'unsc_veh_cryo_hero_01',
  'vfx_shielddomedissolve': 'questionmark',
};

function normalizeIconId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

const normalizedIconLookup = (() => {
  const lookup = new Map<string, string>();
  Object.entries(officialUnitIconById).forEach(([key, url]) => {
    lookup.set(normalizeIconId(key), url);
  });
  return lookup;
})();

function getDirectIconUrl(objectId?: string | null): string {
  if (!objectId) return '';
  const direct = officialUnitIconById[objectId.toLowerCase() as keyof typeof officialUnitIconById];
  return typeof direct === 'string' ? direct : '';
}

function buildCandidateIds(objectId: string): string[] {
  const lower = objectId.trim().toLowerCase();
  const candidates = new Set<string>([lower]);
  const alias = gameObjectIconAliases[lower];
  if (alias) candidates.add(alias);

  const normalized = normalizeIconId(lower);
  const normalizedReplacements: Array<[string, string]> = [
    ['genericsuicidegrunt', 'suicidegrunt01'],
    ['genericbrutejumppack', 'brutejumppack01'],
    ['genericgrunt', 'grunt01'],
    ['genericmarine', 'marine01'],
    ['genericarbiterenforcer', 'elitecommando01'],
    ['genericarbitergruntsquad', 'grunt01'],
    ['airsentineltier2generic', 'airsentineltier201'],
    ['airsentinel01', 'airsentineltier101'],
    ['airserinapegasus01', 'airpegasus01'],
    ['vehserinahero01', 'vehcryohero01'],
    ['vehjohnsonmantis01', 'vehrmmantis02'],
    ['bldgturretaa01', 'bldgantiairturret01'],
    ['bldgturretav01', 'bldgantivehicleturret01'],
    ['bldgdropturret01', 'turretdrop1'],
    ['bldgunbreakablemegaturret01', 'bldgmegaturret01'],
    ['infgenericmarine', 'infmarine01'],
    ['infserinacryomarines01', 'infcryomarines01'],
    ['infomegateamleon01', 'infomegateamleon01'],
    ['infomegateamrobert01', 'infomegateamrobert01'],
    ['infomegateamjerome01', 'infspartanlaser01upgrade2'],
    ['omegateamaugust01', 'infomegateamaugust01'],
    ['infspartanmpdoug01', 'infspartanrocket01'],
    ['infspartanmpjerome01', 'infspartanlaser01upgrade2'],
  ];
  normalizedReplacements.forEach(([from, to]) => {
    if (normalized.includes(from)) candidates.add(normalized.replace(from, to));
  });

  if (/_0[2-9]$/.test(lower)) {
    candidates.add(lower.replace(/_0[2-9]$/, '_01'));
  }

  if (lower.includes('_generic_')) {
    candidates.add(lower.replace('_generic_', '_'));
  }

  return [...candidates];
}

function resolveIconUrlByCandidate(objectId?: string | null): string {
  if (!objectId) return '';
  for (const candidate of buildCandidateIds(objectId)) {
    if (candidate === 'questionmark') return '';
    const direct = getDirectIconUrl(candidate);
    if (direct) return direct;
    const normalized = normalizedIconLookup.get(normalizeIconId(candidate));
    if (normalized) return normalized;
  }
  return '';
}

const displayNameByObjectId = (() => {
  const lookup = new Map<string, string>();
  const mappings = hw2NameMappings?.idMaps;
  const load = (source?: Record<string, string>) => {
    if (!source) return;
    Object.entries(source).forEach(([key, value]) => {
      lookup.set(key.trim().toLowerCase(), value);
    });
  };
  load(mappings?.units);
  load(mappings?.buildings);
  return lookup;
})();

const iconUrlByDisplayName = (() => {
  const lookup = new Map<string, string>();
  displayNameByObjectId.forEach((displayName, objectId) => {
    const resolved = resolveIconUrlByCandidate(objectId);
    if (!resolved) return;
    const key = displayName.trim().toLowerCase();
    if (!lookup.has(key)) lookup.set(key, resolved);
  });
  return lookup;
})();

export function getGameObjectIcon(objectId?: string | null): string {
  if (!objectId) return '';

  const resolved = resolveIconUrlByCandidate(objectId);
  if (resolved) return resolved;

  const displayName = displayNameByObjectId.get(objectId.trim().toLowerCase());
  if (displayName) {
    const byName = iconUrlByDisplayName.get(displayName.trim().toLowerCase());
    if (byName) return byName;
  }

  return '';
}

export function hasGameObjectIcon(objectId?: string | null): boolean {
  if (!objectId) return false;
  return Boolean(getGameObjectIcon(objectId));
}
