import { useCallback, useEffect, useState } from 'react'

const INITIAL_EDITS = {
  buildings: {},
  trees: {},
  roads: {},
  pois: {},
  landmarks: {},
  greenSpaces: {},
  flyovers: {},
  underpasses: {},
  junctions: {},
}

export function useCityEditState() {
  const [appMode, setAppMode] = useState('explore') // 'explore' | 'edit'
  const [gizmoMode, setGizmoMode] = useState('translate') // 'translate' | 'rotate'
  const [cityEdits, setCityEdits] = useState(INITIAL_EDITS)
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [activeFlyoverAlternativeId, setActiveFlyoverAlternativeId] = useState('alternative1')

  // Push new state to undo/redo history
  const recordHistory = useCallback(
    (newEdits) => {
      setHistory((prev) => {
        const next = prev.slice(0, historyIndex + 1)
        return [...next, newEdits]
      })
      setHistoryIndex((prev) => prev + 1)
    },
    [historyIndex],
  )

  // Update specific object edit
  const updateObjectEdit = useCallback(
    (id, type, changes) => {
      if (!id || !type) return

      setCityEdits((prev) => {
        const category =
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
                      : type === 'underpass'
                        ? 'underpasses'
                        : type === 'junction'
                          ? 'junctions'
                          : 'greenSpaces'

        const currentObjEdits = prev[category][id] || {}
        const updatedObj = { ...currentObjEdits, ...changes }

        const next = {
          ...prev,
          [category]: {
            ...prev[category],
            [id]: updatedObj,
          },
        }

        recordHistory(next)
        return next
      })
    },
    [recordHistory],
  )

  // Reset a single object's edits
  const resetObjectEdit = useCallback(
    (id, type) => {
      if (!id || !type) return

      setCityEdits((prev) => {
        const category =
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
                      : type === 'underpass'
                        ? 'underpasses'
                        : type === 'junction'
                          ? 'junctions'
                          : 'greenSpaces'

        const nextCategory = { ...prev[category] }
        delete nextCategory[id]

        const next = {
          ...prev,
          [category]: nextCategory,
        }

        recordHistory(next)
        return next
      })
    },
    [recordHistory],
  )

  // Reset all city edits
  const resetCityEdits = useCallback(() => {
    setCityEdits(INITIAL_EDITS)
    recordHistory(INITIAL_EDITS)
  }, [recordHistory])

  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1
      setCityEdits(history[prevIndex])
      setHistoryIndex(prevIndex)
    }
  }, [history, historyIndex])

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1
      setCityEdits(history[nextIndex])
      setHistoryIndex(nextIndex)
    }
  }, [history, historyIndex])

  // Keyboard shortcut listener for Ctrl+Z and Ctrl+Y
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'y' || (e.key === 'z' && e.shiftKey))
      ) {
        e.preventDefault()
        redo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  // Helper to get active edits for an object
  const getObjectEdits = useCallback(
    (id, type) => {
      if (!id || !type) return null
      const category =
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
                    : type === 'underpass'
                      ? 'underpasses'
                      : type === 'junction'
                        ? 'junctions'
                        : 'greenSpaces'

      return cityEdits[category]?.[id] || null
    },
    [cityEdits],
  )

  const hasAnyEdits = Object.values(cityEdits).some(
    (cat) => Object.keys(cat).length > 0,
  )

  return {
    appMode,
    setAppMode,
    gizmoMode,
    setGizmoMode,
    cityEdits,
    updateObjectEdit,
    resetObjectEdit,
    resetCityEdits,
    getObjectEdits,
    hasAnyEdits,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    activeFlyoverAlternativeId,
    setActiveFlyoverAlternativeId,
  }
}
