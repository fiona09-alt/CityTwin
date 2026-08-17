import { memo } from 'react'

function TopBar({
  dayNightMode,
  onToggleDayNight,
  onResetCamera,
  viewMode,
  onChangeViewMode,
  appMode,
  setAppMode,
  showCitizenFeed,
  onToggleCitizenFeed,
}) {
  return (
    <header className="top-bar-overlay glass-panel">
      {/* Brand & Location */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
            color: '#ffffff',
            display: 'grid',
            placeItems: 'center',
            fontWeight: 900,
            fontSize: '13px',
            boxShadow: '0 4px 12px rgba(56, 189, 248, 0.3)',
          }}
        >
          CT
        </div>
        <div>
          <div
            style={{
              font: "700 8px 'DM Mono', monospace",
              letterSpacing: '0.14em',
              color: '#38bdf8',
              textTransform: 'uppercase',
            }}
          >
            SMART CITY DIGITAL TWIN
          </div>
          <h1
            style={{
              fontSize: '15px',
              fontWeight: 800,
              color: '#f8fafc',
              margin: 0,
              letterSpacing: '-0.3px',
            }}
          >
            CITYTWIN NAGPUR
          </h1>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '3px 9px',
            fontSize: '10px',
            fontFamily: "'DM Mono', monospace",
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            marginLeft: '8px',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 6px #10b981',
            }}
          />
          Sitabuldi Study Area · 21.1475° N, 79.0899° E
        </div>
      </div>

      {/* Mode Controls & View Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Explore / Sandbox Edit Toggle */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '2px',
            display: 'flex',
            gap: '2px',
          }}
        >
          <button
            type="button"
            onClick={() => setAppMode?.('explore')}
            style={{
              border: 'none',
              background: appMode === 'explore' ? '#38bdf8' : 'transparent',
              color: appMode === 'explore' ? '#0f172a' : '#94a3b8',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '10px',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
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
              color: appMode === 'edit' ? '#0f172a' : '#94a3b8',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '10px',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            🛠 Edit
          </button>
        </div>

        {/* View Switcher: 3D Twin | Satellite | Ground */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '2px',
            display: 'flex',
            gap: '2px',
          }}
        >
          {[
            { id: '3d', label: '🏙️ 3D Twin' },
            { id: 'satellite', label: '🛰️ Satellite' },
            { id: 'ground', label: '🚶 Ground' },
          ].map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => onChangeViewMode(mode.id)}
              style={{
                border: 'none',
                background: viewMode === mode.id ? 'rgba(255, 255, 255, 0.14)' : 'transparent',
                color: viewMode === mode.id ? '#ffffff' : '#94a3b8',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '10px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* Day / Night Toggle */}
        <button
          type="button"
          onClick={onToggleDayNight}
          title="Toggle Day/Night Lighting"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#f8fafc',
            borderRadius: '8px',
            padding: '5px 9px',
            fontSize: '10px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {dayNightMode === 'night' ? '🌙 Night' : '☀️ Day'}
        </button>

        {/* Reset Camera */}
        <button
          type="button"
          onClick={onResetCamera}
          title="Reset Camera View"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#f8fafc',
            borderRadius: '8px',
            padding: '5px 9px',
            fontSize: '10px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          ↺ Reset
        </button>

        {/* Citizen Feed / Voting Toggle */}
        <button
          type="button"
          onClick={onToggleCitizenFeed}
          title="Toggle Citizen Voting & Results Feed"
          style={{
            background: showCitizenFeed ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.08)',
            border: showCitizenFeed ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)',
            color: showCitizenFeed ? '#38bdf8' : '#f8fafc',
            borderRadius: '8px',
            padding: '5px 9px',
            fontSize: '10px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          📊 Citizen Feed
        </button>
      </div>
    </header>
  )
}

export default memo(TopBar)
