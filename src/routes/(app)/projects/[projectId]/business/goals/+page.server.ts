import { error, fail, redirect } from "@sveltejs/kit"
import type { Actions, PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({
  locals: { supabase, user },
  params,
}) => {
  if (!user) {
    redirect(303, "/login") // Or your specific login path
  }
  if (!params.projectId) {
    error(404, "Project not found")
  }

  // Verify project access using the RLS helper function implicitly via queries
  // Fetching the core business data - RLS ensures user has access
  const businessPromise = supabase
    .from("project_business_details")
    .select("goals_user")
    .eq("project_id", params.projectId)
    .maybeSingle() // Use maybeSingle as it might not exist yet

  // Run all data fetching in parallel
  const [{ data: business, error: businessError }] = await Promise.all([
    businessPromise,
  ])

  // Check for critical errors (e.g., if RLS denied access unexpectedly)
  // Individual sections might fail gracefully, but log errors.
  if (businessError)
    console.error("Error loading business:", businessError.message)

  return {
    // Ensure we pass back null or data, never undefined for business
    business: business ?? null,
  }
}

export const actions: Actions = {
  saveGoals: async ({ request, locals: { supabase, user }, params }) => {
    const actionName = "saveGoals"
    if (!user) return fail(401, { action: actionName, message: "Unauthorized" })
    const formData = await request.formData()
    const field = formData.get("field")?.toString()
    const content = formData.get("content")
    if (field !== "goals_user" || content === null || content === undefined) {
      return fail(400, {
        action: actionName,
        field,
        error: "Missing or invalid field/content value",
      })
    }
    const contentString = content.toString()
    const { error: upsertError } = await supabase
      .from("project_business_details")
      .upsert(
        { project_id: params.projectId, goals_user: contentString },
        { onConflict: "project_id" },
      )
    if (upsertError) {
      console.error(`Error saving goals:`, upsertError)
      return fail(500, {
        action: actionName,
        field,
        error: `Database error: ${upsertError.message}`,
      })
    }
    return {
      success: true,
      action: actionName,
      field,
      message: "Goals saved.",
    }
  },
}
