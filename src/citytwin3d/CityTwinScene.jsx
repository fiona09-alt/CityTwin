import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { createGeoTransform, SITABULDI_CENTER } from './geoutil'
import BuildingsLayer from './layers/BuildingsLayer'
import RoadsLayer from './layers/RoadsLayer'
import GreenSpacesLayer from './layers/GreenSpacesLayer'
import GroundLayer from './layers/GroundLayer'
import WaterLayer from './layers/WaterLayer'
import LandmarksLayer from './layers/LandmarksLayer'
import PoiLayer from './layers/PoiLayer'
import TreesLayer from './layers/TreesLayer'
import StudyBoundaryLayer from './layers/StudyBoundaryLayer'
import SelectionHighlight from './layers/SelectionHighlight'
import EditableObjectOverlay from './layers/EditableObjectOverlay'
import CameraController from './CameraController'
import FlyoverLayer from './layers/FlyoverLayer'
import UnderpassLayer from './layers/UnderpassLayer'
import JunctionRedesignLayer from './layers/JunctionRedesignLayer'
import TrafficSimulationLayer from './layers/TrafficSimulationLayer'
import { getFlyoverById } from './flyoverData'

const DEFAULT_CAMERA_POS = [-140, 140, 180]
const ISOMETRIC_CAMERA_POS = [280, 280, 280]
const TOPDOWN_CAMERA_POS = [-140, 650, 20]
const GROUND_CAMERA_POS = [-140, 18, 80]
const DEFAULT_TARGET = [-140, 0, 20]

async function fetchGeoJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url} (HTTP ${res.status})`)
  let text = await res.text()
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1)
  }
  return JSON.parse(text)
}

function SceneContents({
  buildingsData,
  roadsData,
  greenSpacesData,
  waterData,
  landmarksData,
  poisData,
  boundaryData,
  geoTransform,
  controlsRef,
  selectedObject,
  onSelectObject,
  presetView,
  onPresetApplied,
  focusTarget,
  onFocusApplied,
  appMode,
  gizmoMode,
  cityEdits,
  onTransformChange,
  activeFlyoverAlternative,
  activeIntervention = 'flyover',
  layerVisibility,
  dayNightMode,
}) {
  const handleGroundPointerMissed = useCallback(() => {
    onSelectObject?.(null)
  }, [onSelectObject])

  const isNight = dayNightMode === 'night'

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableRotate
        enablePan
        enableZoom={false}
        enableDamping
        dampingFactor={0.06}
        minDistance={15}
        maxDistance={3600}
        maxPolarAngle={Math.PI / 2.05}
        target={DEFAULT_TARGET}
      />

      {/* Cursor-relative zoom & camera preset controller */}
      <CameraController
        controlsRef={controlsRef}
        presetView={presetView}
        onPresetApplied={onPresetApplied}
        focusTarget={focusTarget}
        onFocusApplied={onFocusApplied}
      />

      {/* Dynamic Lighting System */}
      <ambientLight intensity={isNight ? 0.12 : 0.38} />
      <hemisphereLight
        args={
          isNight
            ? ['#1e293b', '#0f172a', 0.35]
            : ['#f8fafc', '#94a3b8', 0.62]
        }
        position={[0, 500, 0]}
      />
      <directionalLight
        position={isNight ? [400, 900, 500] : [650, 1100, 750]}
        intensity={isNight ? 0.35 : 1.45}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={100}
        shadow-camera-far={3200}
        shadow-camera-left={-1600}
        shadow-camera-right={1600}
        shadow-camera-top={1600}
        shadow-camera-bottom={-1600}
        shadow-bias={-0.0004}
      />

      {/* Base Ground Layer */}
      <GroundLayer onPointerDown={handleGroundPointerMissed} />
      {layerVisibility.boundary && (
        <StudyBoundaryLayer data={boundaryData} geoTransform={geoTransform} />
      )}

      {/* GIS Layers */}
      {layerVisibility.water && (
        <WaterLayer
          data={waterData}
          geoTransform={geoTransform}
          onSelectWater={onSelectObject}
        />
      )}
      {layerVisibility.greenSpaces && (
        <GreenSpacesLayer
          data={greenSpacesData}
          geoTransform={geoTransform}
          onSelectGreenSpace={onSelectObject}
        />
      )}
      {layerVisibility.roads && (
        <RoadsLayer
          data={roadsData}
          geoTransform={geoTransform}
          onSelectRoad={onSelectObject}
        />
      )}
      {layerVisibility.buildings && (
        <BuildingsLayer
          data={buildingsData}
          geoTransform={geoTransform}
          onSelectBuilding={onSelectObject}
        />
      )}
      {layerVisibility.trees && (
        <TreesLayer
          greenSpacesData={greenSpacesData}
          geoTransform={geoTransform}
          cityEdits={cityEdits}
          onSelectTree={onSelectObject}
        />
      )}
      {layerVisibility.pois && (
        <PoiLayer
          data={poisData}
          geoTransform={geoTransform}
          onSelectPoi={onSelectObject}
        />
      )}
      {layerVisibility.landmarks && (
        <LandmarksLayer
          data={landmarksData}
          geoTransform={geoTransform}
          selectedObject={selectedObject}
          onSelectLandmark={onSelectObject}
        />
      )}

      {/* Selection Highlight */}
      {appMode === 'explore' && (
        <SelectionHighlight
          selectedObject={selectedObject}
          geoTransform={geoTransform}
        />
      )}

      {/* Transform Gizmo Overlay */}
      <EditableObjectOverlay
        selectedObject={selectedObject}
        appMode={appMode}
        gizmoMode={gizmoMode}
        cityEdits={cityEdits}
        geoTransform={geoTransform}
        controlsRef={controlsRef}
        onTransformChange={onTransformChange}
      />

      {/* Active Infrastructure Intervention Rendering */}
      {activeIntervention === 'flyover' && layerVisibility.flyover && activeFlyoverAlternative && (
        <FlyoverLayer
          alternative={activeFlyoverAlternative}
          flyoverEdits={cityEdits?.flyovers?.[activeFlyoverAlternative.id]}
          isSelected={selectedObject?.id === activeFlyoverAlternative.id}
          appMode={appMode}
          gizmoMode={gizmoMode}
          onSelect={onSelectObject}
          onTransformChange={onTransformChange}
          controlsRef={controlsRef}
        />
      )}

      {activeIntervention === 'underpass' && (
        <UnderpassLayer
          underpassEdits={cityEdits?.underpasses?.sitabuldi_underpass}
          isSelected={selectedObject?.id === 'sitabuldi_underpass'}
          appMode={appMode}
          gizmoMode={gizmoMode}
          onSelect={onSelectObject}
          onTransformChange={onTransformChange}
          controlsRef={controlsRef}
        />
      )}

      {activeIntervention === 'junction' && (
        <JunctionRedesignLayer
          junctionEdits={cityEdits?.junctions?.sitabuldi_junction_redesign}
          isSelected={selectedObject?.id === 'sitabuldi_junction_redesign'}
          appMode={appMode}
          gizmoMode={gizmoMode}
          onSelect={onSelectObject}
          onTransformChange={onTransformChange}
          controlsRef={controlsRef}
        />
      )}

      {/* Animated Traffic Simulation & Congestion Heat Layer */}
      <TrafficSimulationLayer activeIntervention={activeIntervention} />
    </>
  )
}

function CityTwinScene({
  _activeProject,
  showProject,
  selectedObject,
  onSelectObject,
  appMode = 'explore',
  setAppMode,
  gizmoMode = 'translate',
  _setGizmoMode,
  cityEdits,
  updateObjectEdit,
  resetCityEdits,
  hasAnyEdits,
  activeFlyoverAlternativeId = 'alternative1',
  activeIntervention = 'flyover',
  onSelectAlternative,
  layerVisibility = {
    buildings: true,
    roads: true,
    flyover: true,
    trees: true,
    greenSpaces: true,
    water: true,
    landmarks: true,
    pois: true,
    boundary: true,
  },
  onToggleLayer,
  dayNightMode = 'day',
  onToggleDayNight,
  viewMode = '3d',
  _onChangeViewMode,
}) {
  const [buildingsData, setBuildingsData] = useState(null)
  const [roadsData, setRoadsData] = useState(null)
  const [greenSpacesData, setGreenSpacesData] = useState(null)
  const [waterData, setWaterData] = useState(null)
  const [landmarksData, setLandmarksData] = useState(null)
  const [poisData, setPoisData] = useState(null)
  const [boundaryData, setBoundaryData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [presetView, setPresetView] = useState(null)
  const [focusTarget, setFocusTarget] = useState(null)
  const controlsRef = useRef(null)

  const geoTransform = useMemo(
    () => createGeoTransform(SITABULDI_CENTER, 1.0),
    [],
  )

  const activeFlyoverAlternative = useMemo(
    () => getFlyoverById(activeFlyoverAlternativeId),
    [activeFlyoverAlternativeId],
  )

  useEffect(() => {
    let isMounted = true
    setLoading(true)

    Promise.allSettled([
      fetchGeoJson('/data/sitabuldi/buildings_clean.json'),
      fetchGeoJson('/data/sitabuldi/roads_clean.json'),
      fetchGeoJson('/data/sitabuldi/green_spaces_clean.json'),
      fetchGeoJson('/data/sitabuldi/water_bodies_clean.json'),
      fetchGeoJson('/data/sitabuldi/landmarks_clean.json'),
      fetchGeoJson('/data/sitabuldi/important_places_clean.json'),
      fetchGeoJson('/data/sitabuldi/study_boundary.json'),
    ]).then(([bRes, rRes, gRes, wRes, lRes, pRes, sRes]) => {
      if (!isMounted) return

      if (bRes.status === 'fulfilled') setBuildingsData(bRes.value)
      if (rRes.status === 'fulfilled') setRoadsData(rRes.value)
      if (gRes.status === 'fulfilled') setGreenSpacesData(gRes.value)
      if (wRes.status === 'fulfilled') setWaterData(wRes.value)
      if (lRes.status === 'fulfilled') setLandmarksData(lRes.value)
      if (pRes.status === 'fulfilled') setPoisData(pRes.value)
      if (sRes.status === 'fulfilled') setBoundaryData(sRes.value)

      if (
        bRes.status === 'rejected' &&
        rRes.status === 'rejected' &&
        gRes.status === 'rejected'
      ) {
        setLoadError('Unable to load primary 3D spatial layers for Sitabuldi.')
      }

      setLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [])

  // Handle View Mode Camera Positions
  useEffect(() => {
    if (viewMode === 'ground') {
      setPresetView({ position: GROUND_CAMERA_POS, target: [0, 5, 0] })
    } else if (viewMode === '3d') {
      setPresetView({ position: DEFAULT_CAMERA_POS, target: DEFAULT_TARGET })
    }
  }, [viewMode])

  const handleApplyPreset = useCallback((pos) => {
    setPresetView({ position: pos, target: DEFAULT_TARGET })
  }, [])

  const isNight = dayNightMode === 'night'

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '520px',
        background: isNight
          ? 'linear-gradient(135deg, #0b1320, #0f172a 52%, #1e293b)'
          : 'linear-gradient(135deg, #e8f1ee, #edf2f2 52%, #dce9e7)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 3D Canvas Viewport */}
      <Canvas
        shadows
        camera={{
          position: DEFAULT_CAMERA_POS,
          fov: 45,
          near: 1,
          far: 15000,
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      >
        <SceneContents
          buildingsData={buildingsData}
          roadsData={roadsData}
          greenSpacesData={greenSpacesData}
          waterData={waterData}
          landmarksData={landmarksData}
          poisData={poisData}
          boundaryData={boundaryData}
          geoTransform={geoTransform}
          controlsRef={controlsRef}
          selectedObject={selectedObject}
          onSelectObject={onSelectObject}
          presetView={presetView}
          onPresetApplied={() => setPresetView(null)}
          focusTarget={focusTarget}
          onFocusApplied={() => setFocusTarget(null)}
          appMode={appMode}
          gizmoMode={gizmoMode}
          cityEdits={cityEdits}
          onTransformChange={updateObjectEdit}
          activeFlyoverAlternative={activeFlyoverAlternative}
          activeIntervention={activeIntervention}
          layerVisibility={layerVisibility}
          dayNightMode={dayNightMode}
        />
      </Canvas>

      {/* Top Floating Controls Bar */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 10,
          display: 'flex',
          gap: '6px',
          alignItems: 'center',
        }}
      >
        {/* Mode Switcher */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--line, #d9e3e5)',
            borderRadius: '8px',
            padding: '2px',
            boxShadow: '0 2px 8px rgba(16, 43, 54, 0.06)',
          }}
        >
          <button
            type="button"
            onClick={() => setAppMode?.('explore')}
            style={{
              border: 'none',
              background: appMode === 'explore' ? '#102b36' : 'transparent',
              color: appMode === 'explore' ? '#ffffff' : '#475569',
              borderRadius: '6px',
              padding: '5px 8px',
              fontSize: '10px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            🧭 Explore
          </button>
          <button
            type="button"
            onClick={() => setAppMode?.('edit')}
            style={{
              border: 'none',
              background: appMode === 'edit' ? '#f59e0b' : 'transparent',
              color: appMode === 'edit' ? '#000000' : '#475569',
              borderRadius: '6px',
              padding: '5px 8px',
              fontSize: '10px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            🛠 Edit
          </button>
        </div>

        {/* Day/Night Toggle */}
        <button
          type="button"
          onClick={onToggleDayNight}
          title="Toggle Day/Night"
          style={sceneButtonStyle}
        >
          {isNight ? '🌙 Night' : '☀️ Day'}
        </button>

        {/* Camera Presets */}
        <button
          type="button"
          onClick={() => handleApplyPreset(DEFAULT_CAMERA_POS)}
          title="Overview Perspective"
          style={sceneButtonStyle}
        >
          <span>↺</span> Reset
        </button>
        <button
          type="button"
          onClick={() => handleApplyPreset(ISOMETRIC_CAMERA_POS)}
          title="Isometric View"
          style={sceneButtonStyle}
        >
          <span>🧊</span> Iso
        </button>
        <button
          type="button"
          onClick={() => handleApplyPreset(TOPDOWN_CAMERA_POS)}
          title="Top-Down Plan"
          style={sceneButtonStyle}
        >
          <span>⬇</span> Plan
        </button>

        {hasAnyEdits && (
          <button
            type="button"
            onClick={resetCityEdits}
            title="Reset All City Sandbox Edits"
            style={{
              ...sceneButtonStyle,
              border: '1px solid #fecaca',
              background: '#fef2f2',
              color: '#b91c1c',
            }}
          >
            <span>⟲</span> Reset City
          </button>
        )}
      </div>

      {/* Floating Status Badge (Top-Left inside twin card) */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          zIndex: 10,
          pointerEvents: 'none',
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--line, #d9e3e5)',
          borderRadius: '8px',
          padding: '6px 10px',
          boxShadow: '0 2px 8px rgba(16, 43, 54, 0.06)',
        }}
      >
        <div
          style={{
            font: "700 8px 'DM Mono', monospace",
            letterSpacing: '0.12em',
            color: appMode === 'edit' ? '#d97706' : '#0284c7',
            textTransform: 'uppercase',
          }}
        >
          {appMode === 'edit'
            ? '● SANDBOX EDIT MODE'
            : showProject
              ? 'PROPOSED SCENARIO'
              : 'BASELINE TWIN'}
        </div>
        <div
          style={{
            fontSize: '12px',
            fontWeight: 800,
            color: '#102b36',
            marginTop: '1px',
          }}
        >
          {activeFlyoverAlternative?.name || 'Sitabuldi Baseline'}
        </div>
      </div>

      {/* Floating Bottom Control Bar inside Twin Viewport: Flyover Alternatives & GIS Layer Toggles */}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          right: '12px',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          pointerEvents: 'auto',
        }}
      >
        {/* Flyover Alternative Selector Row */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--line, #d9e3e5)',
            borderRadius: '10px',
            padding: '4px 6px',
            alignItems: 'center',
            boxShadow: '0 4px 12px rgba(16, 43, 54, 0.08)',
          }}
        >
          <span
            style={{
              font: "700 9px 'DM Mono', monospace",
              color: '#507078',
              paddingLeft: '4px',
              paddingRight: '6px',
              textTransform: 'uppercase',
            }}
          >
            Flyover:
          </span>
          {[
            { id: 'alternative1', label: 'Alt-1: Direct Connector' },
            { id: 'alternative2', label: 'Alt-2: Kingsway Elevated' },
            { id: 'alternative3', label: 'Alt-3: Ram Jhula Extended' },
          ].map((alt) => {
            const isActive = activeFlyoverAlternativeId === alt.id
            return (
              <button
                key={alt.id}
                type="button"
                onClick={() => onSelectAlternative?.(alt.id)}
                style={{
                  flex: 1,
                  padding: '5px 8px',
                  borderRadius: '6px',
                  border: isActive
                    ? '1px solid #f59e0b'
                    : '1px solid var(--line, #d9e3e5)',
                  background: isActive ? '#fef3c7' : '#ffffff',
                  color: isActive ? '#92400e' : '#334155',
                  fontSize: '10px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                {alt.label}
              </button>
            )
          })}
        </div>

        {/* GIS Layers Toggle Bar */}
        <div
          style={{
            display: 'flex',
            gap: '4px',
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--line, #d9e3e5)',
            borderRadius: '10px',
            padding: '4px 6px',
            alignItems: 'center',
            overflowX: 'auto',
            boxShadow: '0 4px 12px rgba(16, 43, 54, 0.08)',
          }}
        >
          <span
            style={{
              font: "700 9px 'DM Mono', monospace",
              color: '#507078',
              paddingLeft: '4px',
              paddingRight: '4px',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            Layers:
          </span>
          {[
            { id: 'buildings', label: 'Buildings' },
            { id: 'roads', label: 'Roads' },
            { id: 'flyover', label: 'Flyover' },
            { id: 'trees', label: 'Trees' },
            { id: 'greenSpaces', label: 'Parks' },
            { id: 'water', label: 'Water' },
            { id: 'landmarks', label: 'Landmarks' },
            { id: 'pois', label: 'POIs' },
          ].map((layer) => {
            const isVis = Boolean(layerVisibility?.[layer.id])
            return (
              <button
                key={layer.id}
                type="button"
                onClick={() => onToggleLayer?.(layer.id)}
                style={{
                  padding: '4px 7px',
                  borderRadius: '5px',
                  border: isVis
                    ? '1px solid #38bdf8'
                    : '1px solid var(--line, #d9e3e5)',
                  background: isVis ? '#e0f2fe' : '#ffffff',
                  color: isVis ? '#0369a1' : '#64748b',
                  fontSize: '10px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {isVis ? '✓ ' : ''}
                {layer.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(240, 244, 246, 0.88)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              border: '3px solid #cbd5e1',
              borderTopColor: '#f68b3c',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <div
            style={{
              font: "600 11px 'DM Mono', monospace",
              color: '#334155',
              letterSpacing: '0.08em',
            }}
          >
            LOADING SITABULDI 3D DIGITAL TWIN...
          </div>
        </div>
      )}

      {/* Error state */}
      {loadError && (
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            background: 'rgba(254, 242, 242, 0.95)',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '11px',
            zIndex: 20,
          }}
        >
          {loadError}
        </div>
      )}
    </div>
  )
}

const sceneButtonStyle = {
  background: 'rgba(255, 255, 255, 0.92)',
  backdropFilter: 'blur(8px)',
  border: '1px solid var(--line, #d9e3e5)',
  borderRadius: '8px',
  padding: '5px 8px',
  fontSize: '10px',
  fontWeight: 700,
  color: '#344b54',
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(16, 43, 54, 0.06)',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
}

export default memo(CityTwinScene)
