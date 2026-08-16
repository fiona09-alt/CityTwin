const PROJECT_IDS = ['flyover', 'underpass', 'smart-junction']
const PRIORITIES = ['traffic', 'greenSpace', 'pedestrian', 'emergency']

function emptyProjectCounts() {
  return Object.fromEntries(PRIORITIES.map((priority) => [priority, 0]))
}

export function updateVoteCounts(votes) {
  const counts = Object.fromEntries(
    PROJECT_IDS.map((projectId) => [projectId, emptyProjectCounts()]),
  )

  for (const vote of votes ?? []) {
    const projectCounts = counts[vote?.project_id]

    if (projectCounts && Object.hasOwn(projectCounts, vote.priority)) {
      projectCounts[vote.priority] += 1
    }
  }

  return counts
}
