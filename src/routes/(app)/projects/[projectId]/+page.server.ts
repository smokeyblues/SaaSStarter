// src/routes/(app)/projects/[projectId]/+page.server.ts
import { error, redirect, fail } from "@sveltejs/kit"
import type { PageServerLoad, Actions } from "./$types"

export const load: PageServerLoad = async ({
  params,
  locals: { supabase, safeGetSession },
}) => {
  // 1. Get session/user
  const { session, user } = await safeGetSession()
  if (!session || !user) {
    throw redirect(303, "/login")
  }

  // 2. Get projectId
  const projectId = params.projectId
  if (!projectId) {
    throw error(400, { message: "Project ID is missing." })
  }

  // 3. Fetch Project and basic Team details using the RPC function
  const { data: authorizedProjectData, error: rpcError } = await supabase
    .rpc("get_project_details_for_member", { input_project_id: projectId })
    // Use maybeSingle as function returns 0 rows if project not found or user lacks access
    .maybeSingle()

  // 4. Handle DB/RPC errors
  if (rpcError) {
    if (rpcError.message.includes("User must be authenticated")) {
      error(401, "Unauthorized") // Or redirect(303, '/login')
    }
    console.error("Error calling get_project_details_for_member RPC:", rpcError)
    throw error(500, {
      message: `Failed to load project data via RPC: ${rpcError.message}`,
    })
  }

  // 5. Handle Project Not Found OR No Access (function returns empty set / null)
  if (!authorizedProjectData) {
    // We need to determine if it was Not Found vs Forbidden.
    // A simple way is to check project existence separately if needed,
    // but for now, we can combine them or default to 404.
    // Let's check existence separately for a clearer error message.
    const { error: existenceError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .limit(1)
      .single() // Use .single() here - we expect it if it exists

    if (existenceError) {
      // If this errors (e.g., 0 rows), the project genuinely doesn't exist
      throw error(404, { message: "Project not found." })
    } else {
      // If project exists but RPC returned null, it means user lacked permission
      throw error(403, {
        message: "You do not have permission to view this project.",
      })
    }
  }

  // 6. Success: Data is fetched and authorized. Return it.
  // Structure the data as needed by the page component
  return {
    project: {
      id: authorizedProjectData.project_id,
      name: authorizedProjectData.project_name,
      // Add other project fields returned by the function if needed
    },
    team: {
      id: authorizedProjectData.team_id,
      name: authorizedProjectData.team_name,
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

  deleteProject: async ({ locals: { supabase, session }, params }) => {
    const { projectId } = params
    const user = session?.user
    const actionData = { action: "deleteProject" }

    if (!user) {
      return fail(401, { ...actionData, error: "Unauthorized" })
    }

    // 1. Get the project's owning team ID
    const { data: projectData, error: projectFetchError } = await supabase
      .from("projects")
      .select("owner_team_id")
      .eq("id", projectId)
      .single()

    if (projectFetchError || !projectData) {
      console.error(
        "Error fetching project for delete check:",
        projectFetchError,
      )
      return fail(404, { ...actionData, error: "Project not found." })
    }

    const teamId = projectData.owner_team_id

    // 2. Verify user is the OWNER of the team that owns the project
    const { data: teamData, error: teamFetchError } = await supabase
      .from("teams")
      .select("owner_user_id")
      .eq("id", teamId)
      .single()

    if (teamFetchError || !teamData) {
      console.error("Error fetching team for delete check:", teamFetchError)
      return fail(500, {
        ...actionData,
        error: "Could not verify team ownership for project deletion.",
      })
    }

    if (teamData.owner_user_id !== user.id) {
      return fail(403, {
        ...actionData,
        error: "Only the team owner can delete this project.",
      })
    }

    // 3. Delete the project
    const { error: deleteError } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId)

    if (deleteError) {
      console.error("Error deleting project:", deleteError)
      // Handle potential foreign key constraints if needed
      return fail(500, { ...actionData, error: "Failed to delete project." })
    }

    // 4. Redirect to the team page after successful deletion
    redirect(303, `/teams/${teamId}`)
  },
}
