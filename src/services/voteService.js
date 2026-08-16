import { supabase } from '../lib/supabase'

const PROJECT_IDS = new Set(['flyover', 'underpass', 'smart-junction'])
const PRIORITIES = new Set(['traffic', 'greenSpace', 'pedestrian', 'emergency'])

function validateVote(projectId, priority) {
  if (!PROJECT_IDS.has(projectId)) {
    throw new Error(`Invalid project ID: ${projectId}`)
  }

  if (!PRIORITIES.has(priority)) {
    throw new Error(`Invalid vote priority: ${priority}`)
  }
}

export async function insertVote(projectId, priority) {
  validateVote(projectId, priority)

  const { data, error } = await supabase
    .from('votes')
    .insert([{ project_id: projectId, priority }])
    .select()
    .single()

  if (error) {
    throw new Error(`Unable to insert vote: ${error.message}`)
  }

  return data
}

export async function getVotes() {
  const { data, error } = await supabase
    .from('votes')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Unable to fetch votes: ${error.message}`)
  }

  return data ?? []
}
