// src/routes/(app)/projects/[projectId]/+page.server.ts
import { error, redirect, fail } from "@sveltejs/kit"
import type { PageServerLoad, Actions } from "./$types"

export const load: PageServerLoad = async ({
  params,
  locals: { supabase, safeGetSession },
}) => {
  // 1. Get session/user (layout should handle redirect if not logged in, but check again)
  const { session, user } = await safeGetSession()
  if (!session || !user) {
    throw redirect(303, "/login")
  }

  // 2. Get projectId from route parameters
  const projectId = params.projectId
  if (!projectId) {
    // Should not happen with file-based routing, but good practice
    throw error(400, { message: "Project ID is missing." })
  }

  // 3. Fetch Project details AND its owning Team details in one query
  // Also implicitly checks if the project exists
  const { data: projectData, error: projectError } = await supabase
    .from("projects")
    .select(
      `
            id,
            name,
            created_at,
            updated_at,
            teams ( id, name )
        `,
    ) // Select project fields and related team fields
    .eq("id", projectId)
    .maybeSingle() // Use maybeSingle as project might not exist

  // 4. Handle DB errors or project not found
  if (projectError) {
    console.error("Error fetching project data:", projectError)
    throw error(500, { message: "Failed to load project data." })
  }
  if (!projectData) {
    throw error(404, { message: "Project not found." })
  }

  // Extract team data - maybeSingle returns null if team relationship doesn't exist (shouldn't happen)
  const teamData = projectData.teams
  if (!teamData) {
    // This indicates a data integrity issue (project without a valid team)
    console.error(`Project ${projectId} is missing team data.`)
    throw error(500, { message: "Project data is incomplete." })
  }

  // 5. ***Crucial Security Check***: Verify user is a member of the project's team
  const { error: membershipError } = await supabase
    .from("team_memberships")
    .select("team_id") // Only need to check for existence
    .eq("user_id", user.id)
    .eq("team_id", teamData.id) // Check against the team ID fetched from the project
    .limit(1)
    .single() // Errors if no row is found

  // 6. Handle permission errors
  if (membershipError) {
    // If .single() errors, user is not a member or another DB error occurred
    console.error(
      `Permission check failed for user ${user.id} on team ${teamData.id}:`,
      membershipError,
    )
    throw error(403, {
      message: "You do not have permission to view this project.",
    })
  }

  // 7. Success: Return the validated project and team data
  return {
    project: {
      // Pass only needed project fields
      id: projectData.id,
      name: projectData.name,
      // Add other project fields if needed by the page
    },
    team: {
      // Pass only needed team fields
      id: teamData.id,
      name: teamData.name,
    },
  }
}

export const actions: Actions = {
  updateProjectName: async ({
    request,
    locals: { supabase, session },
    params,
  }) => {
    const formData = await request.formData()
    const newName = formData.get("projectName") as string
    const { projectId } = params
    const user = session?.user

    // Return the name field consistently on validation errors for this action
    const actionData = { action: "updateName", currentName: newName || null }

    if (!user) {
      return fail(401, {
        ...actionData,
        error: "Unauthorized",
        currentName: undefined,
      }) // Don't expose name on auth fail
    }

    if (
      !newName ||
      typeof newName !== "string" ||
      newName.trim().length === 0
    ) {
      return fail(400, {
        ...actionData, // Includes currentName
        error: "Project name cannot be empty",
      })
    }

    // Verify user has permission to update the project
    // First get the project's team
    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .select("owner_team_id")
      .eq("id", projectId)
      .single()

    if (projectError || !projectData) {
      console.error("Error fetching project for update check:", projectError)
      return fail(404, {
        action: "updateName",
        error: "Project not found",
        currentName: undefined,
      })
    }

    // Check if user is a member of the team
    const { error: membershipError } = await supabase
      .from("team_memberships")
      .select("role")
      .eq("user_id", user.id)
      .eq("team_id", projectData.owner_team_id)
      .single()

    if (membershipError) {
      return fail(403, {
        action: "updateName",
        error: "You do not have permission to update this project",
        currentName: undefined,
      })
    }

    // Update the project name
    const { error: updateError } = await supabase
      .from("projects")
      .update({ name: newName.trim() })
      .eq("id", projectId)

    if (updateError) {
      console.error("Error updating project name:", updateError)
      return fail(500, {
        action: "updateName",
        error: "Failed to update project name",
        currentName: newName, // Keep name on server error for retry
      })
    }

    // Success case does not need currentName
    return {
      action: "updateName",
      success: true,
      message: "Project name updated successfully.",
    }
  },
}
