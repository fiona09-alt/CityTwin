import { useMemo } from 'react'
import { getScenarioComparison } from '../citytwin3d/scenarioImpactModel'

export default function ScenarioComparisonModal({ isOpen, onClose, cityEdits = {}, selectedPriority = null }) {
  const comparison = useMemo(() => {
    return getScenarioComparison(cityEdits, selectedPriority)
  }, [cityEdits, selectedPriority])

  if (!isOpen) return null

  const { baseline, scenarios, recommended, rationale } = comparison
  const allColumns = [baseline, ...scenarios]

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          maxWidth: '1050px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
          border: '1px solid var(--line, #d9e3e5)',
          padding: '24px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '16px',
            borderBottom: '1px solid #e2e8f0',
            paddingBottom: '14px',
          }}
        >
          <div>
            <div
              style={{
                font: "700 10px 'DM Mono', monospace",
                letterSpacing: '0.12em',
                color: '#0284c7',
                textTransform: 'uppercase',
              }}
            >
              MULTI-CRITERIA DECISION MATRIX
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', margin: '4px 0 0' }}>
              Side-by-Side Planning Scenario Comparison
            </h2>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>
              Sitabuldi Junction Common Anchor · Priority-Weighted Evaluation {selectedPriority ? `(${selectedPriority.toUpperCase()})` : '(BALANCED)'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              fontSize: '14px',
              fontWeight: 800,
              cursor: 'pointer',
              color: '#475569',
            }}
          >
            ✕
          </button>
        </div>

        {/* Recommended Option Callout Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #10b98115, #05966925)',
            border: '2px solid #10b981',
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🏆</span>
              <span
                style={{
                  font: "800 13px 'DM Mono', monospace",
                  color: '#047857',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                RECOMMENDED OPTION: {recommended.name}
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#065f46', margin: '6px 0 0', lineHeight: 1.4 }}>
              <strong>Data-Driven Rationale:</strong> {rationale}
            </p>
          </div>

          <div
            style={{
              background: '#10b981',
              color: '#ffffff',
              borderRadius: '10px',
              padding: '8px 14px',
              textAlign: 'center',
              flexShrink: 0,
            }}
          >
            <div style={{ font: "700 9px 'DM Mono', monospace" }}>OVERALL SCORE</div>
            <div style={{ fontSize: '22px', fontWeight: 900 }}>{recommended.overallScore} / 100</div>
          </div>
        </div>

        {/* Comparison Table */}
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '11px',
              textAlign: 'left',
            }}
          >
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={thStyle}>METRIC / ATTRIBUTE</th>
                {allColumns.map((col) => {
                  const isRec = col.id === recommended.id
                  return (
                    <th
                      key={col.id}
                      style={{
                        ...thStyle,
                        background: isRec ? '#ecfdf5' : '#f8fafc',
                        color: isRec ? '#047857' : '#1e293b',
                        fontWeight: 900,
                        textAlign: 'center',
                      }}
                    >
                      {isRec && <div style={{ fontSize: '9px', color: '#059669' }}>★ RECOMMENDED</div>}
                      {col.shortName}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {/* Overall Multi-Criteria Score */}
              <tr style={{ background: '#f1f5f9', fontWeight: 800 }}>
                <td style={tdStyle}>OVERALL DECISION SCORE</td>
                {allColumns.map((col) => (
                  <td
                    key={col.id}
                    style={{
                      ...tdStyle,
                      textAlign: 'center',
                      fontSize: '13px',
                      color: col.id === recommended.id ? '#059669' : '#0f172a',
                    }}
                  >
                    <strong>{col.overallScore}</strong> / 100
                  </td>
                ))}
              </tr>

              {/* Physical Specs */}
              <tr>
                <td style={tdStyle}>Lanes Count</td>
                {allColumns.map((col) => (
                  <td key={col.id} style={{ ...tdStyle, textAlign: 'center' }}>
                    {col.lanes} Lanes
                  </td>
                ))}
              </tr>
              <tr>
                <td style={tdStyle}>Structure Length</td>
                {allColumns.map((col) => (
                  <td key={col.id} style={{ ...tdStyle, textAlign: 'center' }}>
                    {col.lengthM} m
                  </td>
                ))}
              </tr>
              <tr>
                <td style={tdStyle}>Hourly Capacity</td>
                {allColumns.map((col) => (
                  <td key={col.id} style={{ ...tdStyle, textAlign: 'center' }}>
                    {col.capacityVph.toLocaleString()} vph
                  </td>
                ))}
              </tr>
              <tr>
                <td style={tdStyle}>Affected Footprint Area</td>
                {allColumns.map((col) => (
                  <td key={col.id} style={{ ...tdStyle, textAlign: 'center' }}>
                    {col.affectedAreaHa} ha
                  </td>
                ))}
              </tr>
              <tr>
                <td style={tdStyle}>Estimated Capital Cost</td>
                {allColumns.map((col) => (
                  <td key={col.id} style={{ ...tdStyle, textAlign: 'center', fontWeight: 700 }}>
                    ₹ {col.costCr} Cr
                  </td>
                ))}
              </tr>
              <tr>
                <td style={tdStyle}>Estimated Construction Time</td>
                {allColumns.map((col) => (
                  <td key={col.id} style={{ ...tdStyle, textAlign: 'center' }}>
                    {col.constructionMonths} mos
                  </td>
                ))}
              </tr>

              {/* Impact Scores (0-100) */}
              <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                <td colSpan={allColumns.length + 1} style={{ padding: '8px 10px', color: '#64748b', fontSize: '10px' }}>
                  IMPACT SCORES (0–100 SCALE)
                </td>
              </tr>
              {['Traffic', 'Pedestrian Access', 'Emergency Access', 'Green Space', 'Drainage', 'Construction Disruption'].map((m) => (
                <tr key={m}>
                  <td style={tdStyle}>{m}</td>
                  {allColumns.map((col) => {
                    const score = col.impacts[m]
                    return (
                      <td
                        key={col.id}
                        style={{
                          ...tdStyle,
                          textAlign: 'center',
                          fontWeight: 700,
                          color: score >= 75 ? '#16a34a' : score >= 60 ? '#d97706' : '#dc2626',
                        }}
                      >
                        {score} / 100
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const thStyle = {
  padding: '10px 12px',
  fontFamily: "'DM Mono', monospace",
  fontSize: '10px',
  letterSpacing: '0.05em',
  borderBottom: '2px solid #e2e8f0',
}

const tdStyle = {
  padding: '8px 12px',
  borderBottom: '1px solid #f1f5f9',
}
