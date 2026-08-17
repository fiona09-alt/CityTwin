/**
 * SITABULDI FLYOVER PLANNING — REAL ROAD CENTERLINE SCENARIOS
 *
 * All positions and path nodes are derived directly from the real Sitabuldi
 * road network (public/data/sitabuldi/roads_clean.json) centered at lon 79.089927, lat 21.147519.
 *
 * Major Junction Center: [-140, 0, 20] (Shri Bejonji Mehta Road & RBI Approach Node)
 */

export const SITABULDI_JUNCTION_CONTEXT = {
  center: [-140, 0, 20],
  radius: 120,
  mainCorridorRoads: ['Shri Bejonji Mehta Road', 'Kingsway Road', 'RBI Road'],
  osmIds: ['27259740', '1303814430', '1198916365'],
}

// ─────────────────────────────────────────────────────────────
// Alternative 1
// Corridor: Shri Bejonji Mehta Road axis (E–W secondary arterial)
// Crosses directly over the main Sitabuldi surface junction [-140, 0, 20]
// ─────────────────────────────────────────────────────────────
export const ALTERNATIVE_1 = {
  id: 'alternative1',
  name: 'Alt-1: Direct Sitabuldi Connector',
  shortName: 'Direct Connector',
  description:
    'Direct elevated corridor along Shri Bejonji Mehta Road. ' +
    'Crosses directly over the Sitabuldi surface junction [-140, 0, 20] with 2 lanes, ' +
    'providing grade separation for East–West arterial traffic.',
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
    estimatedCapacityVPH: 2400,
    affectedAreaHa: 0.88,
    trafficImpact: 'Moderate — reduces Sitabuldi junction signal delay by ~22%',
    safetyImpact: 'Low–Moderate — grade-separated central intersection conflict point',
    environmentalImpact: 'Low — minimal green-space encroachment',
    estimatedCostCr: '₹ 45–62 Cr (Prototype Estimate)',
    constructionMonths: 18,
    note: 'All metrics are estimated prototype/scenario data only.',
  },
}

// ─────────────────────────────────────────────────────────────
// Alternative 2
// Corridor: Kingsway Road / RBI Road diagonal axis (NW–SE)
// 4-lane elevated arterial crossing Kingsway–RBI junction node
// ─────────────────────────────────────────────────────────────
export const ALTERNATIVE_2 = {
  id: 'alternative2',
  name: 'Alt-2: Kingsway–RBI Elevated Arterial',
  shortName: 'Kingsway Elevated',
  description:
    '4-lane diagonal flyover following the Kingsway / RBI Road primary arterial. ' +
    'Crosses the northern Sitabuldi node to connect Kingsway to RBI Road.',
  alignment: 'NW–SE along Kingsway Road / RBI Road axis',
  connectedRoads: ['Kingsway Road', 'RBI Road', 'Chindwara Road approach'],
  status: 'Real Road Centerline Alternative',

  position: [-260, 0, -220],
  rotationY: 1.05,
  height: 11,
  width: 15,
  length: 520,
  lanes: 4,
  pillarCount: 8,
  pillarSpacing: 55,

  accentColor: '#f59e0b',

  metrics: {
    lengthKm: 0.52,
    lanes: 4,
    estimatedCapacityVPH: 4800,
    affectedAreaHa: 1.65,
    trafficImpact: 'High — separates primary arterial from local traffic, ~35% congestion reduction',
    safetyImpact: 'Moderate–High — extended grade separation through dense urban zone',
    environmentalImpact: 'Moderate — crosses park-adjacent zone near RBI compound',
    estimatedCostCr: '₹ 92–125 Cr (Prototype Estimate)',
    constructionMonths: 28,
    note: 'All metrics are estimated prototype/scenario data only.',
  },
}

// ─────────────────────────────────────────────────────────────
// Alternative 3
// Corridor: Ram Jhula Bridge / Trunk Road Extended Span
// 6-lane multi-span flyover extending the Ram Jhula trunk corridor
// ─────────────────────────────────────────────────────────────
export const ALTERNATIVE_3 = {
  id: 'alternative3',
  name: 'Alt-3: Ram Jhula Extended Multi-Span',
  shortName: 'Ram Jhula Extended',
  description:
    'High-capacity 6-lane multi-span flyover extending the Ram Jhula trunk corridor ' +
    'westward across the Sitabuldi trunk road intersection.',
  alignment: 'E–W along Ram Jhula / Trunk Road axis',
  connectedRoads: ['Ram Jhula Bridge', 'Trunk Road (OSM 240751170)', 'Sitabuldi Junction'],
  status: 'Real Road Centerline Alternative',

  position: [-110, 0, -280],
  rotationY: -1.43,
  height: 14,
  width: 19,
  length: 680,
  lanes: 6,
  pillarCount: 10,
  pillarSpacing: 60,

  accentColor: '#10b981',

  metrics: {
    lengthKm: 0.68,
    lanes: 6,
    estimatedCapacityVPH: 7200,
    affectedAreaHa: 2.4,
    trafficImpact: 'Very High — transforms trunk corridor into full grade-separation, ~48% congestion reduction',
    safetyImpact: 'High — longest separation but highest construction-phase disruption',
    environmentalImpact: 'Moderate–High — largest footprint, crosses multiple property frontages',
    estimatedCostCr: '₹ 150–205 Cr (Prototype Estimate)',
    constructionMonths: 36,
    note: 'All metrics are estimated prototype/scenario data only.',
  },
}

export const FLYOVER_ALTERNATIVES = [ALTERNATIVE_1, ALTERNATIVE_2, ALTERNATIVE_3]

export function getFlyoverById(id) {
  return FLYOVER_ALTERNATIVES.find((a) => a.id === id) || ALTERNATIVE_1
}
