import { error } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"
import type { Project } from "$lib/types" // Assuming you have a Project type defined

export const load: PageServerLoad = async ({
  locals: { supabase },
  parent,
}) => {
  // Get session and userTeams data from the parent layout load function
  const { session, userTeams } = await parent()

  // Although the layout should redirect, double-check for session
  if (!session) {
    // This should theoretically not happen due to layout redirect
    throw error(401, "Unauthorized")
  }

  // Assumption: Use the first team found for the user as the active team for the dashboard.
  // Adjust this logic if you have a specific way to determine the active team (e.g., from URL, user prefs).
  const activeTeam = userTeams?.[0]?.teams

  if (!activeTeam?.id) {
    // Handle case where user might not be part of any team yet
    console.warn("User is not associated with any team.")
    return { projects: [] } // Return empty projects array
  }

  const { data: projects, error: projectsError } = await supabase
    .from("projects") // Assuming your table is named 'projects'
    .select("*") // Select all columns, or specify needed ones: 'id, name, description'
    .eq("owner_team_id", activeTeam.id) // Assuming a 'team_id' column links projects to teams

  if (projectsError) {
    console.error("Error fetching projects:", projectsError)
    throw error(500, "Failed to load projects")
  }

  return {
    // Type assertion might be needed depending on your Project type and select query
    projects: (projects as Project[]) ?? [],
  }
}
