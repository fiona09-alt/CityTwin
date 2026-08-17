import { memo } from 'react'

function InspectorPanel({
  selectedObject,
  onClearSelection,
  appMode,
  setAppMode,
  gizmoMode,
  setGizmoMode,
  cityEdits,
  updateObjectEdit,
  resetObjectEdit,
  resetCityEdits,
  hasAnyEdits,
  undo,
  redo,
  canUndo,
  canRedo,
}) {
  const isEditMode = appMode === 'edit'

  const renderModeHeader = () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
        background: '#f1f5f9',
        padding: '3px',
        borderRadius: '10px',
        border: '1px solid var(--line, #d9e3e5)',
      }}
    >
      <button
        type="button"
        onClick={() => setAppMode('explore')}
        style={{
          flex: 1,
          border: 'none',
          background: !isEditMode ? '#102b36' : 'transparent',
          color: !isEditMode ? '#ffffff' : '#64748b',
          borderRadius: '7px',
          padding: '6px 8px',
          fontSize: '11px',
          fontWeight: 800,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        🧭 Explore
      </button>
      <button
        type="button"
        onClick={() => setAppMode('edit')}
        style={{
          flex: 1,
          border: 'none',
          background: isEditMode ? '#f59e0b' : 'transparent',
          color: isEditMode ? '#000000' : '#64748b',
          borderRadius: '7px',
          padding: '6px 8px',
          fontSize: '11px',
          fontWeight: 800,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        🛠 Edit Mode
      </button>
    </div>
  )

  if (!selectedObject) {
    return (
      <div style={{ marginBottom: '12px' }}>
        {renderModeHeader()}
        {hasAnyEdits && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#fef3c7',
              border: '1px solid #fde68a',
              borderRadius: '8px',
              padding: '8px 10px',
              marginTop: '8px',
            }}
          >
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#92400e',
                fontFamily: "'DM Mono', monospace",
              }}
            >
              ● Custom Sandbox Edits Active
            </span>
            <button
              type="button"
              onClick={resetCityEdits}
              style={{
                border: '1px solid #fecaca',
                background: '#fef2f2',
                color: '#b91c1c',
                padding: '3px 7px',
                borderRadius: '5px',
                fontSize: '10px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ⟲ Reset City
            </button>
          </div>
        )}
      </div>
    )
  }

  const {
    id,
    type,
    name,
    height: baseHeight = 8,
    levels: baseLevels = 2,
    footprintArea,
    buildingType,
    highway,
    lanes: baseLanes,
    width: baseWidth,
    category,
    description,
    elevation,
    status,
    greenType,
    areaM2,
    areaHa,
    waterType,
    scale: baseScale = 1.0,
  } = selectedObject

  const currentCategory =
    type === 'building'
      ? 'buildings'
      : type === 'tree'
        ? 'trees'
        : type === 'road'
          ? 'roads'
          : type === 'poi'
            ? 'pois'
            : type === 'landmark'
              ? 'landmarks'
              : type === 'flyover'
                ? 'flyovers'
                : 'greenSpaces'

  const objEdits = cityEdits?.[currentCategory]?.[id] || {}
  const activeHeight = objEdits.height ?? baseHeight
  const activeLevels = Math.max(1, Math.round(activeHeight / 3.3))
  const activeScale = objEdits.scale ?? baseScale
  const activeWidth = objEdits.width ?? baseWidth
  const activeLanes = objEdits.lanes ?? baseLanes
  const isHidden = Boolean(objEdits.hidden)

  const iconMap = {
    building: '🏢',
    road: '流域',
    green_space: '🌿',
    landmark: '📍',
    water: '💧',
    poi: '🏷️',
    tree: '🌳',
    flyover: '🌉',
  }

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid var(--line, #d9e3e5)',
        padding: '14px',
        marginBottom: '14px',
        boxShadow: '0 4px 12px rgba(16, 43, 54, 0.04)',
      }}
    >
      {renderModeHeader()}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '10px',
        }}
      >
        <div>
          <div
            className="kicker"
            style={{
              color: isEditMode ? '#d97706' : '#0284c7',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>{iconMap[type] || '●'}</span>
            <span>{isEditMode ? 'EDITING' : 'INSPECTING'} {type.toUpperCase().replace('_', ' ')}</span>
          </div>
          <h3
            style={{
              fontSize: '15px',
              fontWeight: 800,
              color: '#102b36',
              margin: '2px 0 0',
            }}
          >
            {name}
          </h3>
          <small
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '10px',
              color: '#64748b',
            }}
          >
            ID: {id}
          </small>
        </div>

        <button
          type="button"
          onClick={onClearSelection}
          title="Deselect"
          style={{
            border: '1px solid var(--line, #d9e3e5)',
            background: '#f8fafc',
            borderRadius: '6px',
            width: '24px',
            height: '24px',
            cursor: 'pointer',
            fontSize: '12px',
            color: '#64748b',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          ✕
        </button>
      </div>

      {/* Edit Mode Toolbar */}
      {isEditMode && (
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fef3c7',
            borderRadius: '8px',
            padding: '8px',
            marginBottom: '10px',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: '#b45309',
              marginBottom: '4px',
              fontFamily: "'DM Mono', monospace",
            }}
          >
            3D GIZMO CONTROLS
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              onClick={() => setGizmoMode('translate')}
              style={gizmoButtonStyle(gizmoMode === 'translate')}
            >
              ✚ Move
            </button>
            <button
              type="button"
              onClick={() => setGizmoMode('rotate')}
              style={gizmoButtonStyle(gizmoMode === 'rotate')}
            >
              ↻ Rotate
            </button>
            <button
              type="button"
              onClick={() =>
                updateObjectEdit(id, type, {
                  hidden: !isHidden,
                })
              }
              style={gizmoButtonStyle(isHidden)}
            >
              {isHidden ? '👁 Show' : '✕ Hide'}
            </button>
          </div>
        </div>
      )}

      {/* Interactive Details Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
        }}
      >
        {type === 'building' && (
          <>
            <div style={detailBoxStyle}>
              <span style={labelStyle}>BUILDING TYPE</span>
              <strong style={valueStyle}>{buildingType || 'Generic'}</strong>
            </div>
            <div style={detailBoxStyle}>
              <span style={labelStyle}>FOOTPRINT AREA</span>
              <strong style={valueStyle}>
                {footprintArea ? `${footprintArea} m²` : 'N/A'}
              </strong>
            </div>

            <div style={{ gridColumn: 'span 2', ...detailBoxStyle }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '4px',
                }}
              >
                <span style={labelStyle}>HEIGHT / FLOORS</span>
                <strong style={{ ...valueStyle, color: isEditMode ? '#d97706' : '#102b36' }}>
                  {activeHeight} m ({activeLevels} Floors)
                </strong>
              </div>

              {isEditMode ? (
                <input
                  type="range"
                  min="3.2"
                  max="80"
                  step="0.5"
                  value={activeHeight}
                  onChange={(e) => {
                    const h = parseFloat(e.target.value)
                    updateObjectEdit(id, 'building', {
                      height: h,
                      feature: selectedObject.feature,
                      baseHeight,
                    })
                  }}
                  style={{ width: '100%', cursor: 'pointer', accentColor: '#f59e0b' }}
                />
              ) : (
                <div style={{ fontSize: '10px', color: '#64748b' }}>
                  Base Height: {baseHeight} m ({baseLevels} Levels)
                </div>
              )}
            </div>

            {isEditMode && (
              <div style={{ gridColumn: 'span 2', ...detailBoxStyle }}>
                <span style={labelStyle}>TRANSFORM OFFSETS</span>
                <div style={{ fontSize: '10px', fontFamily: "'DM Mono', monospace", color: '#475569' }}>
                  ΔX: {objEdits.offsetX || 0}m · ΔZ: {objEdits.offsetZ || 0}m · Rot:{' '}
                  {Math.round(((objEdits.rotationY || 0) * 180) / Math.PI)}°
                </div>
              </div>
            )}
          </>
        )}

        {type === 'tree' && (
          <>
            <div style={detailBoxStyle}>
              <span style={labelStyle}>SPECIES</span>
              <strong style={valueStyle}>Urban Tree</strong>
            </div>
            <div style={detailBoxStyle}>
              <span style={labelStyle}>STATUS</span>
              <strong style={valueStyle}>{isHidden ? 'Removed' : 'Active'}</strong>
            </div>

            {isEditMode && (
              <div style={{ gridColumn: 'span 2', ...detailBoxStyle }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '4px',
                  }}
                >
                  <span style={labelStyle}>TREE CANOPY SCALE</span>
                  <strong style={valueStyle}>{activeScale.toFixed(2)}x</strong>
                </div>
                <input
                  type="range"
                  min="0.4"
                  max="2.5"
                  step="0.1"
                  value={activeScale}
                  onChange={(e) =>
                    updateObjectEdit(id, 'tree', {
                      scale: parseFloat(e.target.value),
                    })
                  }
                  style={{ width: '100%', accentColor: '#10b981' }}
                />
              </div>
            )}
          </>
        )}

        {type === 'road' && (
          <>
            <div style={detailBoxStyle}>
              <span style={labelStyle}>HIGHWAY CLASS</span>
              <strong style={valueStyle}>{highway}</strong>
            </div>
            <div style={detailBoxStyle}>
              <span style={labelStyle}>WIDTH</span>
              <strong style={valueStyle}>{activeWidth} m</strong>
            </div>

            {isEditMode && (
              <div style={{ gridColumn: 'span 2', ...detailBoxStyle }}>
                <span style={labelStyle}>ADJUST CAPACITY / LANES</span>
                <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                  {['2 Lanes', '4 Lanes', '6 Lanes'].map((laneOpt) => (
                    <button
                      key={laneOpt}
                      type="button"
                      onClick={() =>
                        updateObjectEdit(id, 'road', {
                          lanes: laneOpt,
                          width: laneOpt === '6 Lanes' ? 14 : laneOpt === '4 Lanes' ? 10 : 6,
                        })
                      }
                      style={{
                        flex: 1,
                        padding: '4px',
                        border: '1px solid var(--line, #d9e3e5)',
                        borderRadius: '5px',
                        fontSize: '10px',
                        fontWeight: 700,
                        background: activeLanes === laneOpt ? '#102b36' : '#ffffff',
                        color: activeLanes === laneOpt ? '#ffffff' : '#334155',
                        cursor: 'pointer',
                      }}
                    >
                      {laneOpt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {type === 'landmark' && (
          <>
            <div style={detailBoxStyle}>
              <span style={labelStyle}>CATEGORY</span>
              <strong style={valueStyle}>{category}</strong>
            </div>
            <div style={detailBoxStyle}>
              <span style={labelStyle}>ELEVATION</span>
              <strong style={valueStyle}>{elevation}</strong>
            </div>
            <div style={{ gridColumn: 'span 2', ...detailBoxStyle }}>
              <span style={labelStyle}>STATUS</span>
              <strong style={valueStyle}>{status}</strong>
            </div>
            {description && (
              <div style={{ gridColumn: 'span 2', ...detailBoxStyle }}>
                <span style={labelStyle}>DESCRIPTION</span>
                <p
                  style={{
                    margin: '2px 0 0',
                    fontSize: '10px',
                    color: '#475569',
                    lineHeight: '1.4',
                  }}
                >
                  {description}
                </p>
              </div>
            )}
          </>
        )}

        {type === 'green_space' && (
          <>
            <div style={detailBoxStyle}>
              <span style={labelStyle}>SPACE TYPE</span>
              <strong style={valueStyle}>{greenType}</strong>
            </div>
            <div style={detailBoxStyle}>
              <span style={labelStyle}>SURFACE AREA</span>
              <strong style={valueStyle}>
                {areaHa ? `${areaHa} ha` : `${areaM2} m²`}
              </strong>
            </div>
          </>
        )}

        {type === 'water' && (
          <div style={{ gridColumn: 'span 2', ...detailBoxStyle }}>
            <span style={labelStyle}>WATER FEATURE</span>
            <strong style={valueStyle}>{waterType}</strong>
          </div>
        )}

        {type === 'flyover' && selectedObject?.alternative && (() => {
          const alt = selectedObject.alternative
          const activeH = objEdits.height ?? alt.height
          const activeW = objEdits.width ?? alt.width
          const activeL = objEdits.length ?? alt.length
          const activeL2 = objEdits.lanes ?? alt.lanes
          const m = alt.metrics
          return (
            <>
              <div style={{ gridColumn: 'span 2', ...detailBoxStyle, background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                <span style={{ ...labelStyle, color: '#0369a1' }}>FLYOVER ALTERNATIVE</span>
                <strong style={{ ...valueStyle, color: '#0c4a6e' }}>{alt.name}</strong>
                <div style={{ fontSize: '10px', color: '#0284c7', marginTop: '2px' }}>{alt.alignment}</div>
              </div>

              {isEditMode ? (
                <>
                  <div style={{ gridColumn: 'span 2', ...detailBoxStyle }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={labelStyle}>DECK HEIGHT</span>
                      <strong style={{ ...valueStyle, color: '#d97706' }}>{activeH} m</strong>
                    </div>
                    <input type="range" min="4" max="25" step="0.5" value={activeH}
                      onChange={e => updateObjectEdit(id, 'flyover', { height: parseFloat(e.target.value) })}
                      style={{ width: '100%', accentColor: '#f59e0b' }} />
                  </div>
                  <div style={{ gridColumn: 'span 2', ...detailBoxStyle }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={labelStyle}>DECK WIDTH</span>
                      <strong style={{ ...valueStyle, color: '#d97706' }}>{activeW} m</strong>
                    </div>
                    <input type="range" min="5" max="20" step="0.5" value={activeW}
                      onChange={e => updateObjectEdit(id, 'flyover', { width: parseFloat(e.target.value) })}
                      style={{ width: '100%', accentColor: '#f59e0b' }} />
                  </div>
                  <div style={{ gridColumn: 'span 2', ...detailBoxStyle }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={labelStyle}>SPAN LENGTH</span>
                      <strong style={{ ...valueStyle, color: '#d97706' }}>{activeL} m</strong>
                    </div>
                    <input type="range" min="50" max="1200" step="10" value={activeL}
                      onChange={e => updateObjectEdit(id, 'flyover', { length: parseFloat(e.target.value) })}
                      style={{ width: '100%', accentColor: '#f59e0b' }} />
                  </div>
                  <div style={{ gridColumn: 'span 2', ...detailBoxStyle }}>
                    <span style={labelStyle}>LANE COUNT</span>
                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                      {[2, 4, 6, 8].map(lc => (
                        <button key={lc} type="button"
                          onClick={() => updateObjectEdit(id, 'flyover', { lanes: lc })}
                          style={{ flex: 1, padding: '4px', border: '1px solid #cbd5e1', borderRadius: '5px',
                            fontSize: '10px', fontWeight: 700, cursor: 'pointer',
                            background: activeL2 === lc ? '#0f172a' : '#fff',
                            color: activeL2 === lc ? '#fff' : '#334155' }}>
                          {lc}L
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={detailBoxStyle}>
                    <span style={labelStyle}>LENGTH</span>
                    <strong style={valueStyle}>{activeL} m</strong>
                  </div>
                  <div style={detailBoxStyle}>
                    <span style={labelStyle}>HEIGHT / WIDTH</span>
                    <strong style={valueStyle}>{activeH}m / {activeW}m</strong>
                  </div>
                  <div style={detailBoxStyle}>
                    <span style={labelStyle}>LANES</span>
                    <strong style={valueStyle}>{activeL2} Lanes</strong>
                  </div>
                  <div style={detailBoxStyle}>
                    <span style={labelStyle}>EST. CAPACITY</span>
                    <strong style={valueStyle}>{m.estimatedCapacityVPH?.toLocaleString()} vph</strong>
                  </div>
                </>
              )}

              <div style={{ gridColumn: 'span 2', ...detailBoxStyle }}>
                <span style={labelStyle}>CONNECTED ROADS</span>
                <strong style={valueStyle}>{alt.connectedRoads?.join(' · ')}</strong>
              </div>
              <div style={{ gridColumn: 'span 2', ...detailBoxStyle }}>
                <span style={labelStyle}>STATUS</span>
                <strong style={{ ...valueStyle, color: '#d97706' }}>{alt.status}</strong>
              </div>
              <div style={{ gridColumn: 'span 2', ...detailBoxStyle, background: '#fffbeb', border: '1px solid #fef3c7' }}>
                <span style={{ ...labelStyle, color: '#92400e' }}>PROTOTYPE METRICS NOTE</span>
                <p style={{ fontSize: '10px', color: '#78350f', margin: '2px 0 0', lineHeight: 1.4 }}>
                  ★ {m.note} Cost estimate: {m.estimatedCostCr}. Construction: ~{m.constructionMonths} months.
                </p>
              </div>
            </>
          )
        })()}

        {type === 'underpass' && (() => {
          const activeD = objEdits.height ?? selectedObject.height ?? 6
          const activeW = objEdits.width ?? selectedObject.width ?? 14
          const activeL = objEdits.length ?? selectedObject.length ?? 560
          const activeL2 = objEdits.lanes ?? selectedObject.lanes ?? 4
          const props = selectedObject.properties || {}
          return (
            <>
              <div style={{ gridColumn: 'span 2', ...detailBoxStyle, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <span style={{ ...labelStyle, color: '#15803d' }}>UNDERPASS INTERVENTION</span>
                <strong style={{ ...valueStyle, color: '#166534' }}>{selectedObject.name}</strong>
                <div style={{ fontSize: '10px', color: '#16a34a', marginTop: '2px' }}>{props.connectedRoads}</div>
              </div>

              {isEditMode ? (
                <>
                  <div style={{ gridColumn: 'span 2', ...detailBoxStyle }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={labelStyle}>TRENCH DEPTH</span>
                      <strong style={{ ...valueStyle, color: '#d97706' }}>{activeD} m</strong>
                    </div>
                    <input type="range" min="3" max="14" step="0.5" value={activeD}
                      onChange={e => updateObjectEdit(id, 'underpass', { height: parseFloat(e.target.value) })}
                      style={{ width: '100%', accentColor: '#f59e0b' }} />
                  </div>
                  <div style={{ gridColumn: 'span 2', ...detailBoxStyle }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={labelStyle}>CARRIAGEWAY WIDTH</span>
                      <strong style={{ ...valueStyle, color: '#d97706' }}>{activeW} m</strong>
                    </div>
                    <input type="range" min="6" max="24" step="0.5" value={activeW}
                      onChange={e => updateObjectEdit(id, 'underpass', { width: parseFloat(e.target.value) })}
                      style={{ width: '100%', accentColor: '#f59e0b' }} />
                  </div>
                  <div style={{ gridColumn: 'span 2', ...detailBoxStyle }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={labelStyle}>CORRIDOR LENGTH</span>
                      <strong style={{ ...valueStyle, color: '#d97706' }}>{activeL} m</strong>
                    </div>
                    <input type="range" min="100" max="1200" step="10" value={activeL}
                      onChange={e => updateObjectEdit(id, 'underpass', { length: parseFloat(e.target.value) })}
                      style={{ width: '100%', accentColor: '#f59e0b' }} />
                  </div>
                </>
              ) : (
                <>
                  <div style={detailBoxStyle}>
                    <span style={labelStyle}>LENGTH / DEPTH</span>
                    <strong style={valueStyle}>{activeL}m / {activeD}m</strong>
                  </div>
                  <div style={detailBoxStyle}>
                    <span style={labelStyle}>LANES / CAPACITY</span>
                    <strong style={valueStyle}>{activeL2}L / {props.estimatedCapacityVPH?.toLocaleString()} vph</strong>
                  </div>
                </>
              )}
            </>
          )
        })()}

        {type === 'junction' && (() => {
          const activeR = objEdits.width ?? selectedObject.radius ?? 35
          const activeW = objEdits.length ?? selectedObject.width ?? 14
          const props = selectedObject.properties || {}
          return (
            <>
              <div style={{ gridColumn: 'span 2', ...detailBoxStyle, background: '#fefce8', border: '1px solid #fef08a' }}>
                <span style={{ ...labelStyle, color: '#a16207' }}>JUNCTION REDESIGN INTERVENTION</span>
                <strong style={{ ...valueStyle, color: '#854d0e' }}>{selectedObject.name}</strong>
                <div style={{ fontSize: '10px', color: '#ca8a04', marginTop: '2px' }}>{props.connectedRoads}</div>
              </div>

              {isEditMode ? (
                <>
                  <div style={{ gridColumn: 'span 2', ...detailBoxStyle }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={labelStyle}>ISLAND RADIUS</span>
                      <strong style={{ ...valueStyle, color: '#d97706' }}>{activeR} m</strong>
                    </div>
                    <input type="range" min="15" max="65" step="1" value={activeR}
                      onChange={e => updateObjectEdit(id, 'junction', { width: parseFloat(e.target.value) })}
                      style={{ width: '100%', accentColor: '#f59e0b' }} />
                  </div>
                  <div style={{ gridColumn: 'span 2', ...detailBoxStyle }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={labelStyle}>RING ROAD WIDTH</span>
                      <strong style={{ ...valueStyle, color: '#d97706' }}>{activeW} m</strong>
                    </div>
                    <input type="range" min="8" max="24" step="1" value={activeW}
                      onChange={e => updateObjectEdit(id, 'junction', { length: parseFloat(e.target.value) })}
                      style={{ width: '100%', accentColor: '#f59e0b' }} />
                  </div>
                </>
              ) : (
                <>
                  <div style={detailBoxStyle}>
                    <span style={labelStyle}>ISLAND RADIUS</span>
                    <strong style={valueStyle}>{activeR} m</strong>
                  </div>
                  <div style={detailBoxStyle}>
                    <span style={labelStyle}>RING ROAD WIDTH</span>
                    <strong style={valueStyle}>{activeW} m</strong>
                  </div>
                </>
              )}
            </>
          )
        })()}
      </div>

      {/* Footer Actions */}
      <div
        style={{
          marginTop: '10px',
          paddingTop: '8px',
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '10px',
          color: '#64748b',
        }}
      >
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            type="button"
            disabled={!canUndo}
            onClick={undo}
            title="Undo (Ctrl+Z)"
            style={historyButtonStyle(!canUndo)}
          >
            ↶ Undo
          </button>
          <button
            type="button"
            disabled={!canRedo}
            onClick={redo}
            title="Redo (Ctrl+Y)"
            style={historyButtonStyle(!canRedo)}
          >
            ↷ Redo
          </button>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {Object.keys(objEdits).length > 0 && (
            <button
              type="button"
              onClick={() => resetObjectEdit(id, type)}
              style={{
                border: '1px solid #fecaca',
                background: '#fef2f2',
                color: '#b91c1c',
                borderRadius: '5px',
                padding: '3px 7px',
                fontSize: '10px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ⟲ Reset Object
            </button>
          )}

          <button
            type="button"
            onClick={onClearSelection}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#0284c7',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '10px',
            }}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  )
}

const detailBoxStyle = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '6px 8px',
}

const labelStyle = {
  font: "600 9px 'DM Mono', monospace",
  color: '#64748b',
  display: 'block',
  marginBottom: '2px',
}

const valueStyle = {
  font: "700 12px 'Manrope', sans-serif",
  color: '#102b36',
}

const gizmoButtonStyle = (active) => ({
  flex: 1,
  padding: '4px 6px',
  borderRadius: '5px',
  border: active ? '1px solid #f59e0b' : '1px solid #cbd5e1',
  background: active ? '#fef3c7' : '#ffffff',
  color: active ? '#92400e' : '#475569',
  fontSize: '10px',
  fontWeight: 700,
  cursor: 'pointer',
})

const historyButtonStyle = (disabled) => ({
  border: '1px solid #e2e8f0',
  background: disabled ? '#f8fafc' : '#ffffff',
  color: disabled ? '#94a3b8' : '#334155',
  borderRadius: '5px',
  padding: '3px 6px',
  fontSize: '10px',
  fontWeight: 700,
  cursor: disabled ? 'not-allowed' : 'pointer',
})

export default memo(InspectorPanel)
