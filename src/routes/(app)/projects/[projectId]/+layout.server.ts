// src/routes/(app)/projects/[projectId]/+layout.server.ts
import { error, redirect, fail } from "@sveltejs/kit"
import type { LayoutServerLoad, Actions } from "./$types"
import type { Database } from "../../../../DatabaseDefinitions" // Adjust path if needed

// Define the structure for section status explicitly
interface SectionStatus {
  treatment: {
    hasSynopsis: boolean
    hasCharacters: boolean // Note: We decided to check 'characterization_attitude' field for now
  }
  business: {
    hasAudience: boolean
    hasGoals: boolean
  }
  design: {
    isStarted: boolean
  }
  functional: {
    isStarted: boolean
  }
  technology: {
    isStarted: boolean
  }
}

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

  // --- Start Parallel Data Fetching ---

  // 3. Fetch Project and basic Team details using the RPC function (Keep this)
  const projectDetailsPromise = supabase
    .rpc("get_project_details_for_member", { input_project_id: projectId })
    .maybeSingle() // Use maybeSingle as function returns 0 rows if project not found or user lacks access

  // 4. Fetch data needed for Section Status Check
  //    Note: RLS is implicitly applied by Supabase based on user context

  // Check Treatment fields (synopsis & characterization_attitude)
  const treatmentStatusPromise = supabase
    .from("project_treatments")
    .select("synopsis, characterization_attitude") // Select only needed fields
    .eq("project_id", projectId)
    .maybeSingle() // It might not exist yet

  // Check Business fields (target_audience & goals_user)
  const businessStatusPromise = supabase
    .from("project_business_details")
    .select("target_audience, goals_user") // Select only needed fields
    .eq("project_id", projectId)
    .maybeSingle() // It might not exist yet

  // Check existence of Functional Spec record (using placeholder table)
  const functionalStatusPromise = supabase
    .from("project_functional_specs")
    .select("project_id", { count: "exact", head: true }) // Just check if a row exists
    .eq("project_id", projectId)

  // Check existence of Design Spec record (using placeholder table)
  const designStatusPromise = supabase
    .from("project_design_specs")
    .select("project_id", { count: "exact", head: true }) // Just check if a row exists
    .eq("project_id", projectId)

  // Check existence of Tech Spec record (using placeholder table) - Though not needed for unlocking logic *yet*
  // const techStatusPromise = supabase
  //     .from('project_tech_specs')
  //     .select('project_id', { count: 'exact', head: true })
  //     .eq('project_id', projectId);

  // --- Await all promises ---
  const [
    { data: authorizedProjectData, error: rpcError },
    { data: treatmentStatusData, error: treatmentStatusError },
    { data: businessStatusData, error: businessStatusError },
    { count: functionalCount, error: functionalStatusError }, // Destructure count directly
    { count: designCount, error: designStatusError }, // Destructure count directly
    // { count: techCount, error: techStatusError }
  ] = await Promise.all([
    projectDetailsPromise,
    treatmentStatusPromise,
    businessStatusPromise,
    functionalStatusPromise,
    designStatusPromise,
    // techStatusPromise
  ])

  // --- Error Handling (Keep similar logic, adjust for new fetches) ---

  // Handle RPC error (critical for project access)
  if (rpcError) {
    // ... (keep existing RPC error handling) ...
    if (rpcError.message.includes("User must be authenticated")) {
      throw error(401, "Unauthorized") // Or redirect(303, '/login')
    }
    console.error("Error calling get_project_details_for_member RPC:", rpcError)
    throw error(500, {
      message: `Failed to load project data via RPC: ${rpcError.message}`,
    })
  }

  // Handle Project Not Found OR No Access (based on RPC result)
  if (!authorizedProjectData) {
    // ... (keep existing "Not Found vs Forbidden" check) ...
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

  // Log non-critical errors from status checks
  if (treatmentStatusError)
    console.warn(
      "Warning loading treatment status:",
      treatmentStatusError.message,
    )
  if (businessStatusError)
    console.warn(
      "Warning loading business status:",
      businessStatusError.message,
    )
  if (functionalStatusError)
    console.warn(
      "Warning loading functional status:",
      functionalStatusError.message,
    )
  if (designStatusError)
    console.warn("Warning loading design status:", designStatusError.message)
  // if (techStatusError) console.warn('Warning loading tech status:', techStatusError.message);

  // --- Calculate Section Status ---
  const sectionStatus: SectionStatus = {
    treatment: {
      // Check if the field exists AND has some non-whitespace content
      hasSynopsis: !!treatmentStatusData?.synopsis?.trim(),
      hasCharacters: !!treatmentStatusData?.characterization_attitude?.trim(), // Using this field as the check
    },
    business: {
      hasAudience: !!businessStatusData?.target_audience?.trim(),
      hasGoals: !!businessStatusData?.goals_user?.trim(), // Using goals_user as the check
    },
    functional: {
      isStarted: (functionalCount ?? 0) > 0, // Check if a record exists
    },
    design: {
      isStarted: (designCount ?? 0) > 0, // Check if a record exists
    },
    technology: {
      isStarted: false, // Defaulting to false, logic depends on functional.isStarted in layout.svelte
      // isStarted: (techCount ?? 0) > 0 // Use this if you need to check the DB record itself
    },
  }

  // --- Return Combined Data ---
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
    sectionStatus, // Pass the calculated status to the layout component
  }
}

// --- Actions (Keep existing project actions like update/delete if they belong here) ---
// Add any relevant actions for this layout level if needed
// Example: updateProjectName and deleteProject actions would likely live here
export const _actions: Actions = {
  updateProjectName: async ({
    request,
    locals: { supabase, user },
    params,
  }) => {
    if (!user) return fail(401, { action: "updateName", error: "Unauthorized" })
    if (!params.projectId)
      return fail(400, { action: "updateName", error: "Project ID missing" })

    const formData = await request.formData()
    const newName = formData.get("projectName")?.toString()?.trim()

    if (!newName) {
      return fail(400, {
        action: "updateName",
        error: "Project name cannot be empty.",
      })
    }

    // Check permissions implicitly via RLS on update
    const { error: updateError } = await supabase
      .from("projects")
      .update({ name: newName })
      .eq("id", params.projectId) // RLS should ensure only authorized users can update

    if (updateError) {
      console.error("Error updating project name:", updateError)
      // Check for specific RLS error if possible, otherwise generic
      if (updateError.message.includes("permission denied")) {
        return fail(403, { action: "updateName", error: "Permission denied." })
      }
      return fail(500, {
        action: "updateName",
        error: `Database error: ${updateError.message}`,
      })
    }

    return {
      success: true,
      action: "updateName",
      message: "Project name updated.",
    }
  },

  deleteProject: async ({ request, locals: { supabase, user }, params }) => {
    if (!user)
      return fail(401, { action: "deleteProject", error: "Unauthorized" })
    if (!params.projectId)
      return fail(400, { action: "deleteProject", error: "Project ID missing" })

    // RLS policy should handle permissions check on delete
    const { error: deleteError } = await supabase
      .from("projects")
      .delete()
      .eq("id", params.projectId)

    if (deleteError) {
      console.error("Error deleting project:", deleteError)
      if (deleteError.message.includes("permission denied")) {
        return fail(403, {
          action: "deleteProject",
          error: "Permission denied.",
        })
      }
      return fail(500, {
        action: "deleteProject",
        error: `Database error: ${deleteError.message}`,
      })
    }

    // Redirect after successful deletion
    throw redirect(303, "/dashboard") // Redirect to dashboard or team page
  },
}
