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
  // Fetch the project's business details
  const businessPromise = supabase
    .from("project_business_details")
    .select("*")
    .eq("project_id", params.projectId)
    .maybeSingle()

  const [{ data: businessDetails, error: businessError }] = await Promise.all([
    businessPromise,
  ])

  if (businessError) {
    console.error(
      "Error loading project business details:",
      businessError.message,
    )
  }

  return {
    businessDetails: businessDetails ?? null,
  }
}

export const actions: Actions = {
  saveAudience: async ({ request, locals: { supabase, user }, params }) => {
    const actionName = "saveAudience"
    if (!user) return fail(401, { action: actionName, message: "Unauthorized" })
    const formData = await request.formData()
    const field = formData.get("field")?.toString()
    const content = formData.get("content")
    if (
      field !== "target_audience" ||
      content === null ||
      content === undefined
    ) {
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
        { project_id: params.projectId, target_audience: contentString },
        { onConflict: "project_id" },
      )
    if (upsertError) {
      console.error(`Error saving audience:`, upsertError)
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
      message: "Audience saved.",
    }
  },
}
