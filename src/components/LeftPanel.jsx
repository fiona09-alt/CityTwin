import { memo } from 'react'

const LAYER_CONFIG = [
  { id: 'buildings', label: 'Buildings (4,419)', icon: '🏢' },
  { id: 'roads', label: 'Road Network', icon: '🛣️' },
  { id: 'flyover', label: 'Flyover Corridor', icon: '🌉' },
  { id: 'trees', label: 'Vegetation / Trees', icon: '🌳' },
  { id: 'greenSpaces', label: 'Parks & Green', icon: '🌿' },
  { id: 'water', label: 'Water Bodies', icon: '💧' },
  { id: 'landmarks', label: 'Landmarks', icon: '📍' },
  { id: 'pois', label: 'Points of Interest', icon: '🏷️' },
]

function LeftPanel({
  layerVisibility,
  onToggleLayer,
  activeFlyoverId,
  onSelectAlternative,
  dayNightMode,
  onToggleDayNight,
}) {
  return (
    <aside className="left-panel-overlay glass-panel">
      {/* Panel Kicker */}
      <div
        style={{
          font: "700 9px 'DM Mono', monospace",
          letterSpacing: '0.14em',
          color: '#38bdf8',
          textTransform: 'uppercase',
        }}
      >
        GIS LAYER CONTROLS
      </div>

      {/* Layers List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {LAYER_CONFIG.map((layer) => {
          const isVisible = Boolean(layerVisibility[layer.id])
          return (
            <button
              key={layer.id}
              type="button"
              onClick={() => onToggleLayer(layer.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 9px',
                borderRadius: '8px',
                border: isVisible
                  ? '1px solid rgba(56, 189, 248, 0.3)'
                  : '1px solid rgba(255, 255, 255, 0.05)',
                background: isVisible
                  ? 'rgba(56, 189, 248, 0.12)'
                  : 'rgba(255, 255, 255, 0.03)',
                color: isVisible ? '#f8fafc' : '#64748b',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600,
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{layer.icon}</span>
                <span>{layer.label}</span>
              </span>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: isVisible ? '#38bdf8' : '#475569',
                  boxShadow: isVisible ? '0 0 6px #38bdf8' : 'none',
                }}
              />
            </button>
          )
        })}
      </div>

      {/* Separator */}
      <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />

      {/* Flyover Alternative Selector */}
      <div>
        <div
          style={{
            font: "700 9px 'DM Mono', monospace",
            letterSpacing: '0.12em',
            color: '#94a3b8',
            marginBottom: '6px',
          }}
        >
          FLYOVER PROPOSALS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[
            { id: 'alternative1', label: 'Alt-1: Direct Connector' },
            { id: 'alternative2', label: 'Alt-2: Kingsway Elevated' },
            { id: 'alternative3', label: 'Alt-3: Ram Jhula Extended' },
          ].map((alt) => {
            const isActive = activeFlyoverId === alt.id
            return (
              <button
                key={alt.id}
                type="button"
                onClick={() => onSelectAlternative(alt.id)}
                style={{
                  padding: '6px 9px',
                  borderRadius: '8px',
                  border: isActive
                    ? '1px solid #f59e0b'
                    : '1px solid rgba(255, 255, 255, 0.06)',
                  background: isActive
                    ? 'rgba(245, 158, 11, 0.16)'
                    : 'rgba(255, 255, 255, 0.03)',
                  color: isActive ? '#fbbf24' : '#94a3b8',
                  fontSize: '10px',
                  fontWeight: 700,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {alt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Quick Environment Toggle */}
      <div
        style={{
          marginTop: 'auto',
          paddingTop: '8px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '10px',
          color: '#94a3b8',
        }}
      >
        <span>Environment</span>
        <button
          type="button"
          onClick={onToggleDayNight}
          style={{
            border: 'none',
            background: 'transparent',
            color: '#38bdf8',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '10px',
          }}
        >
          {dayNightMode === 'night' ? '🌙 Night' : '☀️ Day'}
        </button>
      </div>
    </aside>
  )
}

export default memo(LeftPanel)
