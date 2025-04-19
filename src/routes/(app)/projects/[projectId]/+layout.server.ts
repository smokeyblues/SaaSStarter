// import type { LayoutServerLoad } from "./$types"

// export const load = (async () => {
//   return {}
// }) satisfies LayoutServerLoad

// src/routes/(app)/projects/[projectId]/+page.server.ts
import { error, redirect, fail } from "@sveltejs/kit"
import type { LayoutServerLoad, Actions } from "./$types"

export const load: LayoutServerLoad = async ({
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
