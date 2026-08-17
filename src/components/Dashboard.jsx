import { useCallback, useState } from 'react'
import AlternativeToggle from './AlternativeToggle'
import ImpactPanel from './ImpactPanel'
import VotingPanel from './VotingPanel'
import InspectorPanel from './InspectorPanel'
import { projects } from '../data/projects'
import CityTwinScene from '../citytwin3d/CityTwinScene'
import { useCityEditState } from '../citytwin3d/useCityEditState'

export default function Dashboard(p) {
  const [selectedObject, setSelectedObject] = useState(null)
  const [dayNightMode, setDayNightMode] = useState('day')
  const [viewMode, setViewMode] = useState('3d')
  const [activeIntervention, setActiveIntervention] = useState('flyover')

  const [layerVisibility, setLayerVisibility] = useState({
    buildings: true,
    roads: true,
    flyover: true,
    trees: true,
    greenSpaces: true,
    water: true,
    landmarks: true,
    pois: true,
    boundary: true,
  })

  const editState = useCityEditState()

  const handleToggleLayer = useCallback((layerId) => {
    setLayerVisibility((prev) => ({
      ...prev,
      [layerId]: !prev[layerId],
    }))
  }, [])

  const handleToggleDayNight = useCallback(() => {
    setDayNightMode((prev) => (prev === 'day' ? 'night' : 'day'))
  }, [])

  const handleInterventionChange = useCallback(
    (interventionId) => {
      setActiveIntervention(interventionId)
      setSelectedObject(null)

      // Sync active project for impact panel metrics
      if (interventionId === 'flyover') p.setActiveProject('flyover')
      else if (interventionId === 'underpass') p.setActiveProject('underpass')
      else if (interventionId === 'junction') p.setActiveProject('smart-junction')
    },
    [p],
  )

  const handleSelectAlternative = useCallback(
    (id) => {
      editState.setActiveFlyoverAlternativeId(id)
      setSelectedObject(null)
    },
    [editState],
  )

  return (
    <main>
      {/* Top Header Navigation */}
      <header>
        <div className="logo">CT</div>
        <div>
          <div className="kicker">Smart City Planning</div>
          <h1>CITYTWIN NAGPUR</h1>
          <p>Build it digitally before you build it physically.</p>
        </div>
        <aside>
          Sitabuldi Corridor, Nagpur <b>● LIVE</b>
        </aside>
      </header>

      {/* Main 2-Column Grid: 3D Twin Viewport (Left ~75%) + Right Controls & Context Column (~25%) */}
      <div className="grid">
        {/* Central 3D Digital Twin Viewport Card */}
        <section className="card twin">
          <div className="between">
            <div>
              <div className="kicker">Digital planning environment</div>
              <h2>3D DIGITAL TWIN</h2>
            </div>
            <span className="badge">21.1475° N, 79.0899° E</span>
          </div>

          <div className="scene" style={{ padding: 0, display: 'block' }}>
            <CityTwinScene
              _activeProject={p.activeProject}
              showProject={p.showProject}
              selectedObject={selectedObject}
              onSelectObject={setSelectedObject}
              appMode={editState.appMode}
              setAppMode={editState.setAppMode}
              gizmoMode={editState.gizmoMode}
              setGizmoMode={editState.setGizmoMode}
              cityEdits={editState.cityEdits}
              updateObjectEdit={editState.updateObjectEdit}
              resetCityEdits={editState.resetCityEdits}
              hasAnyEdits={editState.hasAnyEdits}
              activeFlyoverAlternativeId={editState.activeFlyoverAlternativeId}
              activeIntervention={activeIntervention}
              onSelectAlternative={handleSelectAlternative}
              layerVisibility={layerVisibility}
              onToggleLayer={handleToggleLayer}
              dayNightMode={dayNightMode}
              onToggleDayNight={handleToggleDayNight}
              viewMode={viewMode}
              _onChangeViewMode={setViewMode}
            />
          </div>

          <footer>
            ● Sitabuldi 3D Geographic Digital Twin · Scenario:{' '}
            {activeIntervention.toUpperCase()} ·{' '}
            {editState.appMode === 'edit'
              ? 'Sandbox Edit Mode Active'
              : 'Explore Mode Active'}
          </footer>
        </section>

        {/* Right-Side Controls, Context Inspector & Scenario Impact Analytics Column */}
        <aside className="card controls">
          <AlternativeToggle
            activeIntervention={activeIntervention}
            onInterventionChange={handleInterventionChange}
            showProject={p.showProject}
            onToggleProject={p.setShowProject}
          />

          {/* Inspector Panel when an object is selected */}
          <InspectorPanel
            selectedObject={selectedObject}
            onClearSelection={() => setSelectedObject(null)}
            appMode={editState.appMode}
            setAppMode={editState.setAppMode}
            gizmoMode={editState.gizmoMode}
            setGizmoMode={editState.setGizmoMode}
            cityEdits={editState.cityEdits}
            updateObjectEdit={editState.updateObjectEdit}
            resetObjectEdit={editState.resetObjectEdit}
            resetCityEdits={editState.resetCityEdits}
            hasAnyEdits={editState.hasAnyEdits}
            undo={editState.undo}
            redo={editState.redo}
            canUndo={editState.canUndo}
            canRedo={editState.canRedo}
          />

          {/* Scenario Impact Analysis Panel (Radar Chart + Bar Chart) */}
          <ImpactPanel activeProject={p.activeProject} />
        </aside>
      </div>

      {/* Bottom Citizen Voting & Live Results Deck */}
      <div className="bottom">
        <VotingPanel
          activeProject={p.activeProject}
          selectedPriority={p.selectedPriority}
          onPriorityChange={p.setSelectedPriority}
          voteSubmitting={p.voteSubmitting}
          voteSubmitted={p.voteSubmitted}
          voteError={p.voteError}
          onSubmit={p.submitVote}
        />
        <section className="card results">
          <div className="kicker">Realtime vote feed</div>
          <h2>LIVE CITIZEN RESULTS</h2>
          {p.totalVotes === 0 ? (
            <p className="empty">No votes yet — be the first to choose.</p>
          ) : (
            projects.map((x) => {
              const n = Object.values(p.voteCounts[x.id] || {}).reduce(
                (a, b) => a + b,
                0,
              )
              const percent =
                p.totalVotes > 0 ? Math.round((n / p.totalVotes) * 100) : 0
              return (
                <div className="result" style={{ '--c': x.color }} key={x.id}>
                  <b>{x.name}</b>
                  <span>
                    {n} · {percent}%
                  </span>
                  <i>
                    <em style={{ width: `${percent}%` }} />
                  </i>
                </div>
              )
            })
          )}
          <small>
            Results update as new votes arrive. Scenario interface only; not
            citizen research.
          </small>
        </section>
      </div>
    </main>
  )
}
