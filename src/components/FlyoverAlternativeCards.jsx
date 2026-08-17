import { memo } from 'react'
import { FLYOVER_ALTERNATIVES } from '../citytwin3d/flyoverData'

const impactColor = {
  Low: '#10b981',
  Moderate: '#f59e0b',
  High: '#ef4444',
  'Very High': '#a855f7',
  'Low–Moderate': '#34d399',
  'Moderate–High': '#fb923c',
}

function impactBadge(trafficImpact) {
  const level = trafficImpact?.split('—')[0]?.trim() || 'Moderate'
  const color = impactColor[level] || '#94a3b8'
  return (
    <span
      style={{
        background: `${color}25`,
        color,
        border: `1px solid ${color}55`,
        borderRadius: '5px',
        padding: '2px 7px',
        fontSize: '9px',
        fontWeight: 800,
        fontFamily: "'DM Mono', monospace",
        letterSpacing: '0.08em',
        whiteSpace: 'nowrap',
      }}
    >
      {level} Impact
    </span>
  )
}

function AlternativeCard({ alt, isActive, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(alt.id)}
      style={{
        flex: '1 1 0',
        minWidth: '220px',
        maxWidth: '380px',
        background: isActive ? 'rgba(30, 41, 59, 0.9)' : 'rgba(15, 23, 42, 0.65)',
        border: isActive
          ? `2px solid ${alt.accentColor}`
          : '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '14px',
        padding: '13px 14px',
        cursor: 'pointer',
        textAlign: 'left',
        boxShadow: isActive
          ? `0 6px 24px ${alt.accentColor}35`
          : '0 2px 8px rgba(0, 0, 0, 0.2)',
        transition: 'all 0.18s ease',
        outline: 'none',
        position: 'relative',
      }}
    >
      {/* Active indicator pill */}
      {isActive && (
        <span
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: alt.accentColor,
            color: '#0f172a',
            borderRadius: '99px',
            padding: '2px 8px',
            fontSize: '9px',
            fontWeight: 800,
            fontFamily: "'DM Mono', monospace",
            letterSpacing: '0.1em',
          }}
        >
          ACTIVE
        </span>
      )}

      {/* Alt number badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '9px',
          marginBottom: '8px',
        }}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: isActive ? alt.accentColor : 'rgba(255, 255, 255, 0.08)',
            color: isActive ? '#0f172a' : '#94a3b8',
            display: 'grid',
            placeItems: 'center',
            fontSize: '13px',
            fontWeight: 900,
            flexShrink: 0,
          }}
        >
          {alt.id.replace('alternative', '')}
        </div>
        <div>
          <div
            style={{
              font: "800 12px 'Manrope', sans-serif",
              color: '#f8fafc',
              lineHeight: 1.2,
            }}
          >
            {alt.shortName}
          </div>
          <div
            style={{
              font: "600 9px 'DM Mono', monospace",
              color: '#94a3b8',
              marginTop: '1px',
            }}
          >
            {alt.alignment}
          </div>
        </div>
      </div>

      {/* Metrics grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '5px',
          marginBottom: '8px',
        }}
      >
        {[
          { label: 'Length', value: `${alt.metrics.lengthKm * 1000}m` },
          { label: 'Lanes', value: alt.metrics.lanes },
          { label: 'Cap./Hr', value: alt.metrics.estimatedCapacityVPH.toLocaleString() },
          { label: 'Area', value: `${alt.metrics.affectedAreaHa} ha` },
          { label: 'Cost', value: alt.metrics.estimatedCostCr.split(' ')[0] + ' Cr' },
          { label: 'Months', value: alt.metrics.constructionMonths },
        ].map(({ label, value }) => (
          <div
            key={label}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '6px',
              padding: '4px 6px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div
              style={{
                font: "600 8px 'DM Mono', monospace",
                color: '#64748b',
                marginBottom: '1px',
              }}
            >
              {label}
            </div>
            <div
              style={{
                font: "700 11px 'Manrope', sans-serif",
                color: '#f8fafc',
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Impact badge + disclaimer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        {impactBadge(alt.metrics.trafficImpact)}
        <span
          style={{
            font: "500 8px 'DM Mono', monospace",
            color: '#64748b',
          }}
        >
          ★ Prototype Estimate
        </span>
      </div>
    </button>
  )
}

function FlyoverAlternativeCards({ activeFlyoverId, onSelectAlternative }) {
  return (
    <div className="bottom-deck-overlay glass-panel" style={{ padding: '12px 14px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <div>
          <div
            style={{
              font: "700 9px 'DM Mono', monospace",
              letterSpacing: '0.14em',
              color: '#38bdf8',
              textTransform: 'uppercase',
            }}
          >
            FLYOVER PLANNING SCENARIOS
          </div>
          <div
            style={{
              font: "800 14px 'Manrope', sans-serif",
              color: '#f8fafc',
              marginTop: '2px',
            }}
          >
            THREE FLYOVER ALTERNATIVES — Sitabuldi Corridor
          </div>
        </div>
        <span
          style={{
            background: 'rgba(245, 158, 11, 0.16)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: '#fbbf24',
            borderRadius: '6px',
            padding: '3px 8px',
            fontSize: '9px',
            fontWeight: 700,
            fontFamily: "'DM Mono', monospace",
          }}
        >
          ★ All metrics: Prototype / Scenario Data
        </span>
      </div>

      {/* Cards row */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        {FLYOVER_ALTERNATIVES.map((alt) => (
          <AlternativeCard
            key={alt.id}
            alt={alt}
            isActive={activeFlyoverId === alt.id}
            onSelect={onSelectAlternative}
          />
        ))}
      </div>
    </div>
  )
}

export default memo(FlyoverAlternativeCards)
