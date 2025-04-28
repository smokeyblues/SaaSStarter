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
  // Fetching the core treatment data - RLS ensures user has access
  const treatmentPromise = supabase
    .from("project_treatments")
    .select("synopsis")
    .eq("project_id", params.projectId)
    .maybeSingle() // Use maybeSingle as it might not exist yet

  // Run all data fetching in parallel
  const [{ data: treatment, error: treatmentError }] = await Promise.all([
    treatmentPromise,
  ])

  // Check for critical errors (e.g., if RLS denied access unexpectedly)
  // Individual sections might fail gracefully, but log errors.
  if (treatmentError)
    console.error("Error loading treatment:", treatmentError.message)

  return {
    // Ensure we pass back null or data, never undefined for treatment
    treatment: treatment ?? null,
  }
}

export const actions: Actions = {
  saveTreatmentText: async ({
    request,
    locals: { supabase, user },
    params,
  }) => {
    const actionName = "saveTreatmentText"
    if (!user) return fail(401, { action: actionName, message: "Unauthorized" })
    const formData = await request.formData()
    const field = formData.get("field")?.toString()
    const content = formData.get("content")
    if (field !== "synopsis" || content === null || content === undefined) {
      return fail(400, {
        action: actionName,
        field,
        error: "Missing or invalid field/content value",
      })
    }
    const contentString = content.toString()
    const { error: upsertError } = await supabase
      .from("project_treatments")
      .upsert(
        { project_id: params.projectId, synopsis: contentString },
        { onConflict: "project_id" },
      )
    if (upsertError) {
      console.error(`Error saving synopsis:`, upsertError)
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
      message: "Synopsis saved.",
    }
  },
}
