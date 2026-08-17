const METERS_PER_DEGREE_LAT = 111320

export const SITABULDI_CENTER = {
  centerLon: 79.089927,
  centerLat: 21.147519,
}

export function getFeatureCoordinates(feature) {
  const geometry = feature?.geometry
  if (!geometry?.coordinates) return []

  const collect = (value, result = []) => {
    if (!Array.isArray(value)) return result

    if (
      value.length >= 2 &&
      typeof value[0] === 'number' &&
      typeof value[1] === 'number'
    ) {
      result.push(value)
      return result
    }

    value.forEach((item) => collect(item, result))
    return result
  }

  return collect(geometry.coordinates)
}

export function getPolygonRing(coordinates) {
  if (!Array.isArray(coordinates) || coordinates.length === 0) return []

  // Case 1: [ [lon, lat], [lon, lat], ... ]
  if (Array.isArray(coordinates[0]) && typeof coordinates[0][0] === 'number') {
    return coordinates
  }

  // Case 2: [ [ [lon, lat], [lon, lat], ... ] ] (standard GeoJSON polygon ring)
  if (Array.isArray(coordinates[0]) && Array.isArray(coordinates[0][0])) {
    return coordinates[0]
  }

  return []
}

export function calculateBounds(features = []) {
  const coordinates = []

  features.forEach((feature) => {
    coordinates.push(...getFeatureCoordinates(feature))
  })

  if (!coordinates.length) {
    return {
      minLon: 79.074,
      maxLon: 79.106,
      minLat: 21.136,
      maxLat: 21.159,
      centerLon: SITABULDI_CENTER.centerLon,
      centerLat: SITABULDI_CENTER.centerLat,
    }
  }

  let minLon = Infinity
  let maxLon = -Infinity
  let minLat = Infinity
  let maxLat = -Infinity

  for (const [lon, lat] of coordinates) {
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue

    minLon = Math.min(minLon, lon)
    maxLon = Math.max(maxLon, lon)
    minLat = Math.min(minLat, lat)
    maxLat = Math.max(maxLat, lat)
  }

  return {
    minLon,
    maxLon,
    minLat,
    maxLat,
    centerLon: (minLon + maxLon) / 2,
    centerLat: (minLat + maxLat) / 2,
  }
}

export function createGeoTransform(bounds = SITABULDI_CENTER, scale = 1.0) {
  const centerLat = bounds.centerLat ?? SITABULDI_CENTER.centerLat
  const centerLon = bounds.centerLon ?? SITABULDI_CENTER.centerLon
  const latRadians = (centerLat * Math.PI) / 180

  const metersPerDegreeLon = METERS_PER_DEGREE_LAT * Math.cos(latRadians)

  return {
    scale,
    centerLon,
    centerLat,
    metersPerDegreeLon,
    metersPerDegreeLat: METERS_PER_DEGREE_LAT,

    lonLatToWorld(lon, lat) {
      const x = (lon - centerLon) * metersPerDegreeLon * scale
      const z = -(lat - centerLat) * METERS_PER_DEGREE_LAT * scale
      return [x, z]
    },

    worldToLonLat(x, z) {
      const lon = centerLon + x / (metersPerDegreeLon * scale)
      const lat = centerLat - z / (METERS_PER_DEGREE_LAT * scale)
      return [lon, lat]
    },
  }
}

export function getFootprintArea(ring, metersPerDegreeLon) {
  if (!ring || ring.length < 3) return 80
  let area = 0
  for (let i = 0; i < ring.length - 1; i++) {
    const x1 = ring[i][0] * metersPerDegreeLon
    const z1 = ring[i][1] * METERS_PER_DEGREE_LAT
    const x2 = ring[i + 1][0] * metersPerDegreeLon
    const z2 = ring[i + 1][1] * METERS_PER_DEGREE_LAT
    area += x1 * z2 - x2 * z1
  }
  return Math.abs(area / 2)
}

/**
 * Deterministic building height calculation
 * Priority:
 * 1. Valid height tag
 * 2. Valid building:levels tag (multiplied by ~3.3m floor height)
 * 3. Deterministic building-type classification heuristic
 * 4. Deterministic footprint-size estimation
 * 5. Conservative clamped fallback
 */
export function calculateBuildingHeight(feature, metersPerDegreeLon) {
  const props = feature?.properties || {}

  // 1. Explicit valid height tag
  if (props.height) {
    const h = parseFloat(props.height)
    if (Number.isFinite(h) && h > 0) {
      return Math.min(Math.max(h, 3.2), 120)
    }
  }

  // 2. Explicit valid building:levels tag
  if (props['building:levels']) {
    const levels = parseFloat(props['building:levels'])
    if (Number.isFinite(levels) && levels > 0) {
      return Math.min(Math.max(levels * 3.3, 3.3), 120)
    }
  }

  const type = (props.building || '').toLowerCase()
  const idNum = typeof props.osm_id === 'number' ? props.osm_id : (parseInt(props.osm_id, 10) || 0)
  // Deterministic subtle height variation based on OSM ID (-1.2m to +1.2m)
  const idVariation = ((Math.abs(idNum) % 7) - 3) * 0.4

  const ring = getPolygonRing(feature?.geometry?.coordinates)
  const area = getFootprintArea(ring, metersPerDegreeLon || 103980)

  let baseHeight
  switch (type) {
    case 'apartments':
      baseHeight = area > 400 ? 22 : 18
      break
    case 'commercial':
    case 'commercial;yes':
      baseHeight = area > 400 ? 18 : 14
      break
    case 'office':
      baseHeight = area > 400 ? 20 : 15
      break
    case 'hospital':
      baseHeight = 18
      break
    case 'school':
      baseHeight = 12
      break
    case 'train_station':
    case 'transportation':
      baseHeight = 10
      break
    case 'residential':
      baseHeight = area > 200 ? 9.5 : 7.5
      break
    case 'house':
      baseHeight = 7.0
      break
    case 'retail':
      baseHeight = 9.0
      break
    case 'industrial':
    case 'warehouse':
      baseHeight = 10.0
      break
    case 'slum':
      baseHeight = 3.8
      break
    case 'shed':
    case 'garage':
    case 'garages':
    case 'roof':
      baseHeight = 3.5
      break
    case 'construction':
      baseHeight = 6.0
      break
    default: // 'yes' or unclassified
      if (area < 60) baseHeight = 4.5
      else if (area < 150) baseHeight = 7.2
      else if (area < 350) baseHeight = 9.5
      else if (area < 800) baseHeight = 12.5
      else baseHeight = 15.0
      break
  }

  const finalHeight = Math.max(3.2, Math.min(baseHeight + idVariation, 30))
  return parseFloat(finalHeight.toFixed(2))
}

/**
 * Deterministic building color assignment
 */
export function getBuildingColors(feature, height) {
  const props = feature?.properties || {}
  const type = (props.building || '').toLowerCase()

  // Base wall color RGB [0..1]
  let wallColor = [0.86, 0.89, 0.92]
  let roofColor = [0.72, 0.77, 0.82]

  // Known apartment towers (>50m)
  if (height > 50) {
    wallColor = [0.94, 0.88, 0.80]
    roofColor = [0.88, 0.76, 0.64]
    return { wallColor, roofColor }
  }

  switch (type) {
    case 'apartments':
      wallColor = [0.89, 0.86, 0.82]
      roofColor = [0.78, 0.72, 0.67]
      break
    case 'commercial':
    case 'commercial;yes':
    case 'office':
      wallColor = [0.82, 0.87, 0.93]
      roofColor = [0.66, 0.74, 0.83]
      break
    case 'retail':
      wallColor = [0.88, 0.88, 0.86]
      roofColor = [0.75, 0.75, 0.72]
      break
    case 'hospital':
      wallColor = [0.84, 0.92, 0.92]
      roofColor = [0.68, 0.80, 0.81]
      break
    case 'school':
      wallColor = [0.91, 0.89, 0.83]
      roofColor = [0.80, 0.76, 0.68]
      break
    case 'train_station':
    case 'transportation':
      wallColor = [0.83, 0.86, 0.89]
      roofColor = [0.65, 0.70, 0.75]
      break
    case 'industrial':
    case 'warehouse':
      wallColor = [0.80, 0.82, 0.85]
      roofColor = [0.65, 0.68, 0.72]
      break
    case 'slum':
    case 'shed':
    case 'garage':
    case 'garages':
      wallColor = [0.84, 0.83, 0.81]
      roofColor = [0.70, 0.68, 0.65]
      break
    default:
      if (height > 14) {
        wallColor = [0.84, 0.88, 0.92]
        roofColor = [0.70, 0.76, 0.82]
      } else if (height > 8) {
        wallColor = [0.87, 0.89, 0.91]
        roofColor = [0.73, 0.77, 0.81]
      }
      break
  }

  return { wallColor, roofColor }
}

/**
 * Road ribbon width based on highway classification
 */
export function getRoadWidth(highway) {
  switch (highway) {
    case 'primary':
    case 'primary_link':
    case 'trunk':
    case 'trunk_link':
      return 11.0
    case 'secondary':
    case 'secondary_link':
      return 8.5
    case 'tertiary':
    case 'tertiary_link':
      return 6.5
    case 'residential':
    case 'living_street':
      return 5.0
    case 'service':
    case 'pedestrian':
    case 'footway':
      return 3.5
    default:
      return 5.0
  }
}
