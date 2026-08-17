/**
 * DYNAMIC SCENARIO IMPACT & CITIZEN-PRIORITY WEIGHTED DECISION MODEL
 */

export const SCENARIO_DEFAULTS = {
  existing: {
    id: 'existing',
    name: 'Existing Baseline (No Build)',
    shortName: 'Existing Baseline',
    costCr: 0,
    constructionMonths: 0,
    lanes: 2,
    lengthM: 0,
    widthM: 10,
    heightM: 0,
    capacityVph: 1800,
    affectedAreaHa: 0.0,
    rawImpacts: {
      Traffic: 38,
      'Green Space': 75,
      'Pedestrian Access': 52,
      Drainage: 62,
      'Emergency Access': 45,
      'Construction Disruption': 100, // 100 = zero disruption
    },
  },
  alternative1: {
    id: 'alternative1',
    name: 'Alt-1: Direct Straight Flyover',
    shortName: 'Direct Connector',
    costCr: 58,
    constructionMonths: 18,
    lanes: 2,
    lengthM: 380,
    widthM: 11,
    heightM: 8.5,
    capacityVph: 3200,
    affectedAreaHa: 0.85,
    rawImpacts: {
      Traffic: 72,
      'Green Space': 68,
      'Pedestrian Access': 64,
      Drainage: 65,
      'Emergency Access': 70,
      'Construction Disruption': 65,
    },
  },
  alternative2: {
    id: 'alternative2',
    name: 'Alt-2: Split / Branch Flyover',
    shortName: 'Split Branch',
    costCr: 110,
    constructionMonths: 28,
    lanes: 4,
    lengthM: 540,
    widthM: 15,
    heightM: 10.0,
    capacityVph: 5400,
    affectedAreaHa: 1.6,
    rawImpacts: {
      Traffic: 84,
      'Green Space': 58,
      'Pedestrian Access': 58,
      Drainage: 58,
      'Emergency Access': 78,
      'Construction Disruption': 48,
    },
  },
  alternative3: {
    id: 'alternative3',
    name: 'Alt-3: Criss-Cross Multi-Direction Flyover',
    shortName: 'Criss-Cross Interchange',
    costCr: 175,
    constructionMonths: 36,
    lanes: 6,
    lengthM: 720,
    widthM: 19,
    heightM: 13.5,
    capacityVph: 7600,
    affectedAreaHa: 2.5,
    rawImpacts: {
      Traffic: 92,
      'Green Space': 42,
      'Pedestrian Access': 48,
      Drainage: 50,
      'Emergency Access': 86,
      'Construction Disruption': 32,
    },
  },
  underpass: {
    id: 'underpass',
    name: 'Depressed Carriageway Underpass',
    shortName: 'Underpass',
    costCr: 82,
    constructionMonths: 22,
    lanes: 4,
    lengthM: 520,
    widthM: 14,
    heightM: -5.5,
    capacityVph: 4800,
    affectedAreaHa: 1.1,
    rawImpacts: {
      Traffic: 78,
      'Green Space': 72,
      'Pedestrian Access': 76,
      Drainage: 52,
      'Emergency Access': 72,
      'Construction Disruption': 54,
    },
  },
  junction: {
    id: 'junction',
    name: 'At-Grade Junction Redesign & Roundabout',
    shortName: 'Junction Redesign',
    costCr: 32,
    constructionMonths: 8,
    lanes: 4,
    lengthM: 220,
    widthM: 16,
    heightM: 0,
    capacityVph: 3600,
    affectedAreaHa: 0.6,
    rawImpacts: {
      Traffic: 66,
      'Green Space': 88,
      'Pedestrian Access': 92,
      Drainage: 82,
      'Emergency Access': 74,
      'Construction Disruption': 86,
    },
  },
}

/**
 * Returns dynamic weights based on selected citizen priority
 */
export function getWeightsForPriority(priorityId) {
  if (priorityId === 'traffic') {
    return {
      Traffic: 0.50,
      'Pedestrian Access': 0.10,
      'Emergency Access': 0.15,
      'Green Space': 0.10,
      Drainage: 0.05,
      'Construction Disruption': 0.05,
      CostScore: 0.05,
    }
  }
  if (priorityId === 'greenSpace') {
    return {
      Traffic: 0.10,
      'Pedestrian Access': 0.15,
      'Emergency Access': 0.05,
      'Green Space': 0.50,
      Drainage: 0.10,
      'Construction Disruption': 0.05,
      CostScore: 0.05,
    }
  }
  if (priorityId === 'pedestrian') {
    return {
      Traffic: 0.10,
      'Pedestrian Access': 0.50,
      'Emergency Access': 0.10,
      'Green Space': 0.15,
      Drainage: 0.05,
      'Construction Disruption': 0.05,
      CostScore: 0.05,
    }
  }
  if (priorityId === 'emergency') {
    return {
      Traffic: 0.20,
      'Pedestrian Access': 0.10,
      'Emergency Access': 0.50,
      'Green Space': 0.05,
      Drainage: 0.05,
      'Construction Disruption': 0.05,
      CostScore: 0.05,
    }
  }
  if (priorityId === 'disruption') {
    return {
      Traffic: 0.10,
      'Pedestrian Access': 0.15,
      'Emergency Access': 0.05,
      'Green Space': 0.10,
      Drainage: 0.05,
      'Construction Disruption': 0.50,
      CostScore: 0.05,
    }
  }
  // Default balanced weights
  return {
    Traffic: 0.30,
    'Pedestrian Access': 0.15,
    'Emergency Access': 0.15,
    'Green Space': 0.10,
    Drainage: 0.10,
    'Construction Disruption': 0.10,
    CostScore: 0.10,
  }
}

export function computeCostScore(costCr) {
  if (costCr === 0) return 90
  const score = Math.max(10, Math.min(100, Math.round(100 - costCr * 0.45)))
  return score
}

export function calculateScenarioImpacts(key, customEdits = {}, selectedPriority = null) {
  const base = SCENARIO_DEFAULTS[key] || SCENARIO_DEFAULTS.alternative1
  const edits = customEdits[key] || {}

  const lanes = edits.lanes ?? base.lanes
  const height = Math.abs(edits.height ?? base.heightM)
  const width = edits.width ?? base.widthM
  const length = edits.length ?? base.lengthM
  const costCr = base.costCr * (lanes / Math.max(1, base.lanes)) * (length > 0 ? length / Math.max(1, base.lengthM) : 1)

  const trafficBonus = (lanes - 2) * 5 + (capacityMultiplier(key) * 10)
  const traffic = Math.min(98, Math.max(20, Math.round(base.rawImpacts.Traffic + trafficBonus)))

  const greenPen = Math.min(30, Math.round((width * length) / 250))
  const green = Math.max(20, Math.min(95, base.rawImpacts['Green Space'] - (length > 0 ? greenPen * 0.2 : 0)))

  const pedPen = height > 0 ? Math.round(height * 0.8) : 0
  const pedestrian = Math.max(25, Math.min(95, base.rawImpacts['Pedestrian Access'] - pedPen * 0.5))

  const emergency = Math.min(95, Math.max(30, Math.round(base.rawImpacts['Emergency Access'] + (lanes >= 4 ? 8 : 0))))
  const drainage = base.rawImpacts.Drainage
  const construction = Math.max(15, Math.min(100, Math.round(base.rawImpacts['Construction Disruption'] - (length / 50))))
  const costScore = computeCostScore(costCr)

  const impacts = {
    Traffic: Math.round(traffic),
    'Green Space': Math.round(green),
    'Pedestrian Access': Math.round(pedestrian),
    Drainage: Math.round(drainage),
    'Emergency Access': Math.round(emergency),
    'Construction Disruption': Math.round(construction),
    CostScore: Math.round(costScore),
  }

  const weights = getWeightsForPriority(selectedPriority)

  // Calculate weighted overall score based on active citizen priority
  const overallScore = Math.round(
    impacts.Traffic * weights.Traffic +
      impacts['Pedestrian Access'] * weights['Pedestrian Access'] +
      impacts['Emergency Access'] * weights['Emergency Access'] +
      impacts['Green Space'] * weights['Green Space'] +
      impacts.Drainage * weights.Drainage +
      impacts['Construction Disruption'] * weights['Construction Disruption'] +
      impacts.CostScore * weights.CostScore,
  )

  return {
    ...base,
    lanes,
    lengthM: Math.round(length),
    widthM: Math.round(width * 10) / 10,
    heightM: base.heightM < 0 ? -height : height,
    costCr: Math.round(costCr),
    impacts,
    overallScore,
  }
}

function capacityMultiplier(key) {
  if (key === 'alternative3') return 2.2
  if (key === 'alternative2') return 1.6
  if (key === 'alternative1') return 1.1
  if (key === 'underpass') return 1.4
  if (key === 'junction') return 1.0
  return 0.5
}

/**
 * Compare all alternatives & calculate priority-weighted recommendation
 */
export function getScenarioComparison(customEdits = {}, selectedPriority = null) {
  const keys = ['alternative1', 'alternative2', 'alternative3', 'underpass', 'junction']
  const results = keys.map((k) => calculateScenarioImpacts(k, customEdits, selectedPriority))
  const baseline = calculateScenarioImpacts('existing', customEdits, selectedPriority)

  // Find recommended option based on weighted score
  const sorted = [...results].sort((a, b) => b.overallScore - a.overallScore)
  const recommended = sorted[0]

  // Dynamic Rationale based on Citizen Priority
  let rationale = ''
  if (selectedPriority === 'traffic') {
    rationale = `Citizen Priority: TRAFFIC. ${recommended.name} is recommended because it delivers maximum corridor throughput (${recommended.impacts.Traffic}/100) and congestion relief.`
  } else if (selectedPriority === 'greenSpace') {
    rationale = `Citizen Priority: GREEN SPACE. ${recommended.name} is recommended because it preserves urban vegetation (${recommended.impacts['Green Space']}/100) with minimal footprint.`
  } else if (selectedPriority === 'pedestrian') {
    rationale = `Citizen Priority: PEDESTRIAN ACCESS. ${recommended.name} is recommended because it provides safest surface grade pedestrian connectivity (${recommended.impacts['Pedestrian Access']}/100).`
  } else if (selectedPriority === 'emergency') {
    rationale = `Citizen Priority: EMERGENCY ACCESS. ${recommended.name} is recommended for superior corridor clearance (${recommended.impacts['Emergency Access']}/100) for first responders.`
  } else if (selectedPriority === 'disruption') {
    rationale = `Citizen Priority: LOW DISRUPTION. ${recommended.name} is recommended for lowest construction phase inconvenience (${recommended.impacts['Construction Disruption']}/100).`
  } else {
    if (recommended.id === 'alternative1') {
      rationale = 'Provides optimum balance between East–West signal delay relief (72/100) and low capital expenditure (₹58 Cr).'
    } else if (recommended.id === 'alternative2') {
      rationale = 'Offers superior traffic distribution (84/100) across both main arterial branches while maintaining strong emergency access.'
    } else if (recommended.id === 'alternative3') {
      rationale = 'Delivers maximum throughput capacity (92/100) for heavy multi-directional corridor movements.'
    } else if (recommended.id === 'underpass') {
      rationale = 'Achieves excellent surface pedestrian integration (76/100) while separating arterial through-traffic below grade.'
    } else {
      rationale = 'Provides outstanding pedestrian accessibility (92/100) and environmental score (88/100) at lowest capital outlay (₹32 Cr).'
    }
  }

  return {
    baseline,
    scenarios: results,
    recommended,
    rationale,
    selectedPriority,
  }
}
