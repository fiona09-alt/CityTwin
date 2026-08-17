import { memo, useMemo } from 'react'
import { getScenarioComparison } from '../citytwin3d/scenarioImpactModel'

function AlternativeCard({ scenario, isActive, isRecommended, onSelect }) {
  const accentColor =
    scenario.id === 'alternative3'
      ? '#10b981'
      : scenario.id === 'alternative2'
        ? '#f59e0b'
        : '#3b82f6'

  return (
    <button
      type="button"
      onClick={() => onSelect(scenario.id)}
      style={{
        flex: '1 1 0',
        minWidth: '220px',
        maxWidth: '380px',
        background: isActive ? 'rgba(30, 41, 59, 0.92)' : 'rgba(15, 23, 42, 0.65)',
        border: isActive
          ? `2px solid ${accentColor}`
          : isRecommended
            ? '2px solid #22c55e'
            : '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '14px',
        padding: '13px 14px',
        cursor: 'pointer',
        textAlign: 'left',
        boxShadow: isActive
          ? `0 6px 24px ${accentColor}35`
          : '0 2px 8px rgba(0, 0, 0, 0.2)',
        transition: 'all 0.18s ease',
        outline: 'none',
        position: 'relative',
      }}
    >
      {/* Recommended Pill Badge */}
      {isRecommended && (
        <span
          style={{
            position: 'absolute',
            top: '10px',
            right: isActive ? '70px' : '10px',
            background: '#22c55e',
            color: '#0f172a',
            borderRadius: '99px',
            padding: '2px 8px',
            fontSize: '9px',
            fontWeight: 900,
            fontFamily: "'DM Mono', monospace",
            letterSpacing: '0.08em',
          }}
        >
          ★ BEST CHOICE
        </span>
      )}

      {/* Active Indicator */}
      {isActive && (
        <span
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: accentColor,
            color: '#0f172a',
            borderRadius: '99px',
            padding: '2px 8px',
            fontSize: '9px',
            fontWeight: 800,
            fontFamily: "'DM Mono', monospace",
          }}
        >
          ACTIVE
        </span>
      )}

      {/* Alt Title */}
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
            background: isActive ? accentColor : 'rgba(255, 255, 255, 0.08)',
            color: isActive ? '#0f172a' : '#94a3b8',
            display: 'grid',
            placeItems: 'center',
            fontSize: '13px',
            fontWeight: 900,
            flexShrink: 0,
          }}
        >
          {scenario.id.replace('alternative', '')}
        </div>
        <div>
          <div
            style={{
              font: "800 12px 'Manrope', sans-serif",
              color: '#f8fafc',
              lineHeight: 1.2,
            }}
          >
            {scenario.shortName}
          </div>
          <div
            style={{
              font: "600 9px 'DM Mono', monospace",
              color: '#94a3b8',
              marginTop: '1px',
            }}
          >
            Score: <strong style={{ color: '#38bdf8' }}>{scenario.overallScore}/100</strong>
          </div>
        </div>
      </div>

      {/* Dynamic Metrics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '5px',
          marginBottom: '8px',
        }}
      >
        {[
          { label: 'Length', value: `${scenario.lengthM}m` },
          { label: 'Lanes', value: `${scenario.lanes} Lanes` },
          { label: 'Capacity', value: `${scenario.capacityVph.toLocaleString()} vph` },
          { label: 'Area', value: `${scenario.affectedAreaHa} ha` },
          { label: 'Est. Cost', value: `₹ ${scenario.costCr} Cr` },
          { label: 'Build Time', value: `${scenario.constructionMonths} mos` },
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
                font: "700 10px 'Manrope', sans-serif",
                color: '#f8fafc',
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>
    </button>
  )
}

function FlyoverAlternativeCards({ activeFlyoverId, onSelectAlternative, selectedPriority = null, cityEdits = {} }) {
  const comparison = useMemo(() => {
    return getScenarioComparison(cityEdits, selectedPriority)
  }, [cityEdits, selectedPriority])

  const flyoverScenarios = useMemo(() => {
    return comparison.scenarios.filter((s) => s.id.startsWith('alternative'))
  }, [comparison])

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
            FLYOVER PLANNING ALTERNATIVES
          </div>
          <div
            style={{
              font: "800 14px 'Manrope', sans-serif",
              color: '#f8fafc',
              marginTop: '2px',
            }}
          >
            THREE DISTINCT ENGINEERING DESIGNS — Sitabuldi Junction Anchor
          </div>
        </div>
        <span
          style={{
            background: 'rgba(34, 197, 94, 0.16)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            color: '#4ade80',
            borderRadius: '6px',
            padding: '3px 8px',
            fontSize: '9px',
            fontWeight: 800,
            fontFamily: "'DM Mono', monospace",
          }}
        >
          ★ Priority-Weighted Evaluation
        </span>
      </div>

      {/* Cards Row */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        {flyoverScenarios.map((scenario) => (
          <AlternativeCard
            key={scenario.id}
            scenario={scenario}
            isActive={activeFlyoverId === scenario.id}
            isRecommended={comparison.recommended.id === scenario.id}
            onSelect={onSelectAlternative}
          />
        ))}
      </div>
    </div>
  )
}

export default memo(FlyoverAlternativeCards)
