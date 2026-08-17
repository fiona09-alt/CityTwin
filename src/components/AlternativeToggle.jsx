import { memo } from 'react'

const SCENARIOS = [
  { id: 'existing', name: 'Existing Baseline', color: '#64748b' },
  { id: 'flyover', name: 'Flyover Corridor', color: '#f59e0b' },
  { id: 'underpass', name: 'Underpass Corridor', color: '#10b981' },
  { id: 'junction', name: 'Junction Redesign', color: '#38bdf8' },
]

function AlternativeToggle({
  activeIntervention = 'flyover',
  onInterventionChange,
  showProject,
  onToggleProject,
}) {
  return (
    <div>
      <div className="between">
        <div>
          <div className="kicker">Sitabuldi Interventions</div>
          <h3 style={{ fontSize: '13px', fontWeight: 800, margin: '2px 0 6px', color: '#102b36' }}>
            INFRASTRUCTURE PROPOSALS
          </h3>
        </div>
        <div className="before-after" style={{ minWidth: '130px' }}>
          <button
            type="button"
            className={!showProject || activeIntervention === 'existing' ? 'selected' : ''}
            onClick={() => {
              onToggleProject?.(false)
              if (activeIntervention !== 'existing') onInterventionChange?.('existing')
            }}
          >
            BEFORE
          </button>
          <button
            type="button"
            className={showProject && activeIntervention !== 'existing' ? 'selected' : ''}
            onClick={() => {
              onToggleProject?.(true)
              if (activeIntervention === 'existing') onInterventionChange?.('flyover')
            }}
          >
            AFTER
          </button>
        </div>
      </div>

      {/* Top-Level Intervention Selector */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px',
          margin: '8px 0 10px',
        }}
      >
        {SCENARIOS.map((s) => {
          const isActive = activeIntervention === s.id
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                onInterventionChange?.(s.id)
                onToggleProject?.(s.id !== 'existing')
              }}
              style={{
                padding: '8px 6px',
                border: isActive ? `2px solid ${s.color}` : '1px solid var(--line, #d9e3e5)',
                background: isActive ? `${s.color}15` : '#ffffff',
                color: isActive ? s.color : '#334155',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '11px',
                fontWeight: 800,
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#64748b' }}>
                {s.id === 'existing' ? 'BASELINE' : 'INTERVENTION'}
              </div>
              {s.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default memo(AlternativeToggle)
