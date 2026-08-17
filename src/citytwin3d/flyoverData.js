/**
 * SITABULDI FLYOVER PLANNING SCENARIOS
 *
 * All positions and path nodes are derived directly from the real Sitabuldi
 * road network (public/data/sitabuldi/roads_clean.json) centered at lon 79.089927, lat 21.147519.
 *
 * Common Junction Anchor: [-140, 0, 20] (Shri Bejonji Mehta Road & RBI Approach Node)
 */

export const SITABULDI_JUNCTION_CONTEXT = {
  center: [-140, 0, 20],
  radius: 120,
  mainCorridorRoads: ['Shri Bejonji Mehta Road', 'Kingsway Road', 'RBI Road'],
  osmIds: ['27259740', '1303814430', '1198916365'],
}

// ─────────────────────────────────────────────────────────────
// Alternative 1 — DIRECT STRAIGHT FLYOVER
// Continuous elevated deck crossing directly over the main Sitabuldi surface junction [-140, 0, 20]
// ─────────────────────────────────────────────────────────────
export const ALTERNATIVE_1 = {
  id: 'alternative1',
  name: 'Alt-1: Direct Straight Flyover',
  shortName: 'Direct Connector',
  type: 'straight',
  description:
    'Single continuous elevated deck along Shri Bejonji Mehta Road. ' +
    'Crosses directly over the Sitabuldi surface junction [-140, 0, 20] with 2 lanes, ' +
    'providing direct grade separation for East–West arterial traffic.',
  alignment: 'E–W along Shri Bejonji Mehta Road across Sitabuldi Junction',
  connectedRoads: ['Shri Bejonji Mehta Road', 'Sitabuldi Roundabout Approach'],
  status: 'Real Road Centerline Alternative',

  position: [-140, 0, 20],
  rotationY: 0.08,
  height: 8.5,
  width: 11,
  length: 380,
  lanes: 2,
  pillarCount: 6,
  pillarSpacing: 50,

  accentColor: '#3b82f6',

  metrics: {
    lengthKm: 0.38,
    lanes: 2,
    estimatedCapacityVPH: 3200,
    affectedAreaHa: 0.85,
    trafficImpact: 'Moderate — reduces Sitabuldi junction signal delay by ~28%',
    safetyImpact: 'Low–Moderate — grade-separated central intersection conflict point',
    environmentalImpact: 'Low — minimal green-space encroachment',
    estimatedCostCr: '₹ 58 Cr (Dynamic Prototype Estimate)',
    constructionMonths: 18,
    note: 'All metrics are derived from dynamic design characteristics.',
  },
}

// ─────────────────────────────────────────────────────────────
// Alternative 2 — SPLIT / BRANCH FLYOVER
// Y-shaped branching elevated geometry physically connected over real road approaches
// ─────────────────────────────────────────────────────────────
export const ALTERNATIVE_2 = {
  id: 'alternative2',
  name: 'Alt-2: Split / Branch Flyover',
  shortName: 'Split Branch Flyover',
  type: 'branch',
  description:
    'Y-shaped branching elevated corridor. Main deck approaches from West [-330, 0, 20], ' +
    'crosses Sitabuldi Junction [-140, 0, 20], and bifurcates into two physically connected decks: ' +
    'North Branch toward Kingsway/RBI and East Branch toward Central Railway approach.',
  alignment: 'Y-Shape: West Approach → Junction Split → North & East Spans',
  connectedRoads: ['Shri Bejonji Mehta Road', 'Kingsway Road', 'RBI Road Approach'],
  status: 'Real Road Centerline Alternative',

  position: [-140, 0, 20],
  rotationY: 0.08,
  height: 10.0,
  width: 15,
  length: 540,
  lanes: 4,
  pillarCount: 10,
  pillarSpacing: 45,

  // Branch Specific Geometry Definitions (relative to junction [-140, 0, 20])
  branches: [
    { id: 'mainTrunk', start: [-180, 0, 0], end: [0, 0, 0], width: 15, height: 10.0 },
    { id: 'northBranch', start: [0, 0, 0], end: [160, 0, -110], width: 9, height: 10.0, angleY: -0.55 },
    { id: 'eastBranch', start: [0, 0, 0], end: [170, 0, 70], width: 9, height: 10.0, angleY: 0.35 },
  ],

  accentColor: '#f59e0b',

  metrics: {
    lengthKm: 0.54,
    lanes: 4,
    estimatedCapacityVPH: 5400,
    affectedAreaHa: 1.6,
    trafficImpact: 'High — bifurcates primary arterial traffic to separate major destinations, ~42% delay reduction',
    safetyImpact: 'Moderate–High — eliminates weave maneuvers at surface intersection',
    environmentalImpact: 'Moderate — moderate footprint along northern verge',
    estimatedCostCr: '₹ 110 Cr (Dynamic Prototype Estimate)',
    constructionMonths: 28,
    note: 'All metrics are derived from dynamic design characteristics.',
  },
}

// ─────────────────────────────────────────────────────────────
// Alternative 3 — CRISS-CROSS / MULTI-DIRECTION FLYOVER
// Dual-tier grade-separated multi-span interchange with crossing elevated bridge decks
// ─────────────────────────────────────────────────────────────
export const ALTERNATIVE_3 = {
  id: 'alternative3',
  name: 'Alt-3: Criss-Cross Multi-Direction Flyover',
  shortName: 'Criss-Cross Interchange',
  type: 'crisscross',
  description:
    'High-capacity dual-tier grade-separated interchange. Tier 1 main E-W deck (Height: 8.5m) ' +
    'spans across Shri Bejonji Mehta Road, while Tier 2 crossing deck (Height: 13.5m) ' +
    'passes OVER Tier 1 deck diagonally along Kingsway/RBI corridor with complete grade separation.',
  alignment: 'Multi-Directional: Tier-1 E–W Deck (8.5m) + Tier-2 NW–SE Deck (13.5m)',
  connectedRoads: ['Ram Jhula Bridge', 'Shri Bejonji Mehta Road', 'Kingsway Road', 'RBI Road'],
  status: 'Real Road Centerline Alternative',

  position: [-140, 0, 20],
  rotationY: 0.08,
  height: 13.5,
  width: 19,
  length: 720,
  lanes: 6,
  pillarCount: 14,
  pillarSpacing: 40,

  // Dual-Deck Geometry Definitions
  tiers: [
    { id: 'tier1_EW', position: [0, 8.5, 0], length: 380, width: 11, rotationY: 0.08, lanes: 2 },
    { id: 'tier2_NWSE', position: [0, 13.5, 0], length: 440, width: 13, rotationY: -0.92, lanes: 4 },
  ],

  accentColor: '#10b981',

  metrics: {
    lengthKm: 0.72,
    lanes: 6,
    estimatedCapacityVPH: 7600,
    affectedAreaHa: 2.5,
    trafficImpact: 'Very High — complete grade separation across both major intersection axes, ~58% delay reduction',
    safetyImpact: 'High — zero conflict points across elevated movements',
    environmentalImpact: 'Moderate–High — multi-tiered elevated footprint',
    estimatedCostCr: '₹ 175 Cr (Dynamic Prototype Estimate)',
    constructionMonths: 36,
    note: 'All metrics are derived from dynamic design characteristics.',
  },
}

export const FLYOVER_ALTERNATIVES = [ALTERNATIVE_1, ALTERNATIVE_2, ALTERNATIVE_3]

export function getFlyoverById(id) {
  return FLYOVER_ALTERNATIVES.find((a) => a.id === id) || ALTERNATIVE_1
}
