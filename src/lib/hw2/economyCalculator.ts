/**
 * Halo Wars 2 economy outputs (supply/sec, power/sec) from structure counts.
 * Logic ported from https://github.com/Chase-Simmons/Halo-Wars-2-Calculator — fan-made estimates, not official game values.
 */

export const HW2_ECONOMY_LIMITS = {
  maxSupplyPads: 6,
  maxHeavySupplyPads: 9,
} as const;

/** Power income per captured power node (fan estimate). */
export const HW2_POWER_NODE_POWER_PER_SEC = 1.5;

export type Hw2EconomyInputs = {
  supplyPads: number;
  heavySupplyPads: number;
  generators: number;
  heavyGenerators: number;
  powerNodes: number;
};

export type Hw2EconomyResult = {
  supplyPerSec: number;
  powerPerSec: number;
};

function clampNonNegative(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

/**
 * Heavy supply pad contribution by slot index (1-based within heavy pads).
 */
function heavySupplyRateForSlot(slot: number): number {
  switch (slot) {
    case 1:
      return 7.5;
    case 2:
      return 5.75;
    case 3:
      return 4.2;
    case 4:
      return 3.47;
    case 5:
      return 4.41;
    case 6:
      return 0.7;
    case 7:
      return 1.67;
    case 8:
      return 1.3;
    case 9:
      return 1.95;
    default:
      return 0;
  }
}

/**
 * Normal supply pad rate depends on global slot index after heavy pads (same numbering as reference calculator).
 */
function normalSupplyRateForGlobalSlot(globalSlot: number): number {
  switch (globalSlot) {
    case 1:
      return 4.75;
    case 2:
      return 4.28;
    case 3:
      return 3.66;
    case 4:
      return 3.3;
    case 5:
      return 2.95;
    case 6:
      return 2.47;
    default:
      return 0;
  }
}

export function normalizeEconomyInputs(raw: Partial<Hw2EconomyInputs>): Hw2EconomyInputs {
  const sp = Math.floor(clampNonNegative(Number(raw.supplyPads)));
  const hsp = Math.floor(clampNonNegative(Number(raw.heavySupplyPads)));
  const g = Math.floor(clampNonNegative(Number(raw.generators)));
  const hg = Math.floor(clampNonNegative(Number(raw.heavyGenerators)));
  const pn = Math.floor(clampNonNegative(Number(raw.powerNodes)));
  return {
    supplyPads: Math.min(sp, HW2_ECONOMY_LIMITS.maxSupplyPads),
    heavySupplyPads: Math.min(hsp, HW2_ECONOMY_LIMITS.maxHeavySupplyPads),
    generators: g,
    heavyGenerators: hg,
    powerNodes: pn,
  };
}

export function computeHw2Economy(inputs: Hw2EconomyInputs): Hw2EconomyResult {
  const sP = inputs.supplyPads;
  const hSP = inputs.heavySupplyPads;
  const g = inputs.generators;
  const hG = inputs.heavyGenerators;
  const pn = inputs.powerNodes;

  let totalS = 0;
  let totalP = 0;

  for (let i = 0; i < hSP; i++) {
    totalS += heavySupplyRateForSlot(i + 1);
  }

  for (let i = 0; i < sP; i++) {
    const globalSlot = i + 1 + hSP;
    totalS += normalSupplyRateForGlobalSlot(globalSlot);
  }

  totalP += g * 3;
  totalP += hG * 6;
  totalP += pn * HW2_POWER_NODE_POWER_PER_SEC;

  return { supplyPerSec: totalS, powerPerSec: totalP };
}
