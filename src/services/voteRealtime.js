import { supabase } from '../lib/supabase'

const listeners = new Map()
let votesChannel = null

function notifyListeners(vote) {
  listeners.forEach((_, listener) => listener(vote))
}

export function subscribeToVotes(callback) {
  if (typeof callback !== 'function') {
    throw new TypeError('subscribeToVotes requires a callback function.')
  }

  listeners.set(callback, (listeners.get(callback) ?? 0) + 1)

  if (!votesChannel) {
    votesChannel = supabase
      .channel('citytwin-votes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'votes' },
        (payload) => notifyListeners(payload.new),
      )
      .subscribe()
  }

  return () => {
    const listenerCount = listeners.get(callback) ?? 0

    if (listenerCount <= 1) {
      listeners.delete(callback)
    } else {
      listeners.set(callback, listenerCount - 1)
    }

    if (listeners.size === 0 && votesChannel) {
      const channelToRemove = votesChannel
      votesChannel = null
      void supabase.removeChannel(channelToRemove).catch(() => {})
    }
  }
}
