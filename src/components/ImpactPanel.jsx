import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { calculateScenarioImpacts, getScenarioComparison } from '../citytwin3d/scenarioImpactModel'

const metricIcons = {
  Traffic: '↔',
  'Green Space': '◒',
  'Pedestrian Access': '◯',
  Drainage: '≋',
  'Emergency Access': '+',
  'Construction Disruption': '◆',
}

const statusText = (n) => (n >= 75 ? 'High Benefit' : n >= 60 ? 'Moderate Benefit' : 'Trade-off')

export default function ImpactPanel({
  activeProject = 'flyover',
  activeFlyoverAlternativeId = 'alternative1',
  selectedPriority = null,
  cityEdits = {},
}) {
  const scenarioKey = useMemo(() => {
    if (activeProject === 'underpass') return 'underpass'
    if (activeProject === 'smart-junction' || activeProject === 'junction') return 'junction'
    return activeFlyoverAlternativeId || 'alternative1'
  }, [activeProject, activeFlyoverAlternativeId])

  const comparison = useMemo(() => {
    return getScenarioComparison(cityEdits, selectedPriority)
  }, [cityEdits, selectedPriority])

  const activeData = useMemo(() => {
    return calculateScenarioImpacts(scenarioKey, cityEdits, selectedPriority)
  }, [scenarioKey, cityEdits, selectedPriority])

  const baselineData = comparison.baseline

  const radarData = useMemo(() => {
    const metrics = ['Traffic', 'Green Space', 'Pedestrian Access', 'Drainage', 'Emergency Access', 'Construction Disruption']
    return metrics.map((m) => {
      const row = { metric: m }
      row['Existing Baseline'] = baselineData.impacts[m]
      comparison.scenarios.forEach((s) => {
        row[s.shortName] = s.impacts[m]
      })
      return row
    })
  }, [baselineData, comparison])

  const costData = useMemo(() => {
    return [baselineData, ...comparison.scenarios].map((s) => ({
      name: s.shortName,
      cost: s.costCr,
      id: s.id,
    }))
  }, [baselineData, comparison])

  const isRecommended = comparison.recommended.id === scenarioKey

  return (
    <section className="impacts">
      {/* Header */}
      <div className="between">
        <div>
          <div className="kicker">Dynamic Decision Support Model</div>
          <h2 style={{ fontSize: '15px', color: '#102b36', margin: '2px 0' }}>
            {activeData.name}
          </h2>
        </div>
        <span
          className="badge"
          style={{
            background: isRecommended ? '#dcfce7' : '#e0f2fe',
            color: isRecommended ? '#15803d' : '#0369a1',
            border: isRecommended ? '1px solid #86efac' : '1px solid #7dd3fc',
            fontWeight: 800,
          }}
        >
          {isRecommended ? '★ RECOMMENDED' : 'SCENARIO MODEL'}
        </span>
      </div>

      {/* Multi-Criteria Overall Score Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a, #1e293b)',
          color: '#ffffff',
          borderRadius: '10px',
          padding: '10px 12px',
          margin: '10px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ font: "700 9px 'DM Mono', monospace", color: '#94a3b8', letterSpacing: '0.1em' }}>
            PRIORITY-WEIGHTED SCORE {selectedPriority ? `(${selectedPriority.toUpperCase()})` : ''}
          </div>
          <div style={{ fontSize: '18px', fontWeight: 900, color: '#38bdf8', marginTop: '2px' }}>
            {activeData.overallScore} <span style={{ fontSize: '12px', color: '#94a3b8' }}>/ 100</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ font: "700 9px 'DM Mono', monospace", color: '#94a3b8' }}>BEFORE / AFTER</div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#4ade80' }}>
            Existing {baselineData.overallScore} → Proposed {activeData.overallScore} (+{activeData.overallScore - baselineData.overallScore})
          </div>
        </div>
      </div>

      {/* Recommended Option Callout */}
      <div
        style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '8px',
          padding: '8px 10px',
          marginBottom: '12px',
          fontSize: '11px',
          color: '#166534',
        }}
      >
        <div style={{ fontWeight: 800, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span>🏆</span>
          <span>BEST CHOICE: {comparison.recommended.name}</span>
        </div>
        <p style={{ margin: 0, fontSize: '10px', lineHeight: 1.4, color: '#15803d' }}>
          {comparison.rationale}
        </p>
      </div>

      {/* Individual Metrics Progress Bars */}
      <div className="metrics">
        {Object.entries(activeData.impacts).map(([key, val]) => {
          if (key === 'CostScore') return null
          const baseVal = baselineData.impacts[key]
          const diff = val - baseVal
          const diffStr = diff > 0 ? `+${diff}` : `${diff}`
          return (
            <div className="metric" key={key}>
              <div>
                <b>
                  {metricIcons[key]} {key}
                </b>
                <strong>
                  {val}/100{' '}
                  <small style={{ color: diff >= 0 ? '#16a34a' : '#dc2626', fontSize: '9px', fontWeight: 700 }}>
                    ({diffStr})
                  </small>
                </strong>
              </div>
              <i>
                <span style={{ width: `${val}%`, background: val >= 75 ? '#22c55e' : val >= 60 ? '#f59e0b' : '#ef4444' }} />
              </i>
              <small>{statusText(val)}</small>
            </div>
          )
        })}
      </div>

      {/* Dynamic Charts Section */}
      <div className="charts" style={{ marginTop: '14px' }}>
        <h3 style={{ fontSize: '11px', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
          Multi-Impact Radar Analysis
        </h3>
        <div className="radar" style={{ height: '180px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 8 }} />
              <Radar
                name="Existing Baseline"
                dataKey="Existing Baseline"
                stroke="#64748b"
                fill="#64748b"
                fillOpacity={0.1}
                strokeWidth={1.5}
              />
              <Radar
                name={activeData.shortName}
                dataKey={activeData.shortName}
                stroke="#38bdf8"
                fill="#38bdf8"
                fillOpacity={0.35}
                strokeWidth={2.5}
              />
              <Tooltip wrapperStyle={{ fontSize: '10px' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <h3 style={{ fontSize: '11px', fontWeight: 800, color: '#334155', margin: '12px 0 6px' }}>
          Capital Expenditure (₹ Cr)
        </h3>
        <div className="cost" style={{ height: '140px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={costData}>
              <XAxis dataKey="name" tick={{ fontSize: 8 }} />
              <YAxis tick={{ fontSize: 8 }} />
              <Tooltip wrapperStyle={{ fontSize: '10px' }} />
              <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
                {costData.map((entry) => (
                  <Cell
                    key={entry.id}
                    fill={entry.id === scenarioKey ? '#f59e0b' : '#cbd5e1'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  )
}
