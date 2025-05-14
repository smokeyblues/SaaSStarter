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
  const designPromise = supabase
    .from("project_design_specs")
    .select("*")
    .eq("project_id", params.projectId)
    .maybeSingle()

  const [{ data: designDetails, error: designError }] = await Promise.all([
    designPromise,
  ])

  if (designError) {
    console.error("Error loading project design details:", designError.message)
  }

  return {
    designDetails: designDetails ?? null,
  }
}

export const actions: Actions = {
  saveBranding: async ({ request, locals: { supabase, user }, params }) => {
    const actionName = "saveBranding"
    if (!user) return fail(401, { action: actionName, message: "Unauthorized" })
    const formData = await request.formData()
    const field = formData.get("field")?.toString()
    const content = formData.get("content")
    if (
      field !== "branding_guidelines_intro" ||
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
      .from("project_design_specs")
      .upsert(
        {
          project_id: params.projectId,
          branding_guidelines_intro: contentString,
        },
        { onConflict: "project_id" },
      )
    if (upsertError) {
      console.error(`Error saving branding:`, upsertError)
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
      message: "Branding saved.",
    }
  },
}
