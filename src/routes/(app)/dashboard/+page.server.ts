// src/routes/(app)/dashboard/+page.server.ts

import { redirect } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({
  locals: { supabase, safeGetSession },
}) => {
  // Get the validated session and user
  const { session, user } = await safeGetSession()

  // If no user is logged in, redirect to login
  if (!session || !user) {
    throw redirect(303, "/login") // Adjust redirect path if needed
  }

  // Check if the user is part of any teams
  const { data: teamMemberships, error: teamError } = await supabase
    .from("team_memberships") // This should now be type-safe after regenerating types
    .select("team_id") // We only need to know if *any* record exists
    .eq("user_id", user.id)
    .limit(1) // We only need one record to confirm they are in a team

  if (teamError) {
    console.error("Error fetching team memberships:", teamError)
    // Decide how to handle this error - maybe show an error message on the dashboard
    // For now, we'll assume they have no teams if there's an error, but log it.
    return {
      hasTeams: false,
      // You might want to pass profile data too if needed for the welcome message
      profile: null, // Placeholder - fetch profile if needed
    }
  }

  const hasTeams = teamMemberships !== null && teamMemberships.length > 0

  // If they have teams, you might want to load the actual team details here later
  // For now, just knowing *if* they have teams is enough for the dynamic dashboard

  return {
    hasTeams: hasTeams,
    // You might want to pass profile data too if needed for the welcome message
    profile: null, // Placeholder - fetch profile if needed
    // teams: [] // Placeholder - load actual teams if hasTeams is true
    // projects: [] // Placeholder - load projects later
  }
}
