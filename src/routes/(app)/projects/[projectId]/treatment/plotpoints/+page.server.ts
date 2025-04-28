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

  const plotPointsPromise = supabase
    .from("project_plot_points")
    .select("*")
    .eq("project_id", params.projectId)
    .order("order_index", { ascending: true })

  // Run all data fetching in parallel
  const [{ data: plotPoints, error: plotPointsError }] = await Promise.all([
    plotPointsPromise,
  ])

  // Check for critical errors (e.g., if RLS denied access unexpectedly)
  // Individual sections might fail gracefully, but log errors.
  if (plotPointsError)
    console.error("Error loading plot points:", plotPointsError.message)

  return {
    // Ensure we pass back null or data, never undefined for treatment
    plotPoints: plotPoints ?? [],
  }
}

export const actions: Actions = {
  addPlotPoint: async ({ request, locals: { supabase, user }, params }) => {
    const actionName = "addPlotPoint" // <<< Define action name
    if (!user) return fail(401, { action: actionName, message: "Unauthorized" })
    if (!params.projectId)
      return fail(400, { action: actionName, message: "Project ID missing" })
    const formData = await request.formData()
    const description = formData.get("description")?.toString()?.trim()
    if (!description) {
      return fail(400, {
        action: actionName,
        description: "",
        error: "Plot point description cannot be empty.",
      })
    }
    const { count, error: countError } = await supabase
      .from("project_plot_points")
      .select("*", { count: "exact", head: true })
      .eq("project_id", params.projectId)
    if (countError) {
      console.error("Error counting plot points:", countError)
      return fail(500, {
        action: actionName,
        description,
        error: "Database error determining order.",
      })
    }
    const { error: insertError } = await supabase
      .from("project_plot_points")
      .insert({
        project_id: params.projectId,
        description: description,
        order_index: count ?? 0,
      })
    if (insertError) {
      console.error("Error adding plot point:", insertError)
      return fail(500, {
        action: actionName,
        description,
        error: `Database error: ${insertError.message}`,
      })
    }
    return {
      success: true,
      action: actionName,
      type: "plotPoint",
      message: "Plot point added.",
    } // <<< Added action
  },
  updatePlotPoint: async ({ request, locals: { supabase, user }, params }) => {
    const actionName = "updatePlotPoint" // <<< Define action name
    if (!user) return fail(401, { action: actionName, message: "Unauthorized" })
    const formData = await request.formData()
    const id = formData.get("id")?.toString()
    const description = formData.get("description")?.toString()?.trim()
    if (!id)
      return fail(400, { action: actionName, error: "Plot point ID missing." })
    if (!description)
      return fail(400, {
        action: actionName,
        id,
        error: "Plot point description cannot be empty.",
      })
    const { error: updateError } = await supabase
      .from("project_plot_points")
      .update({ description: description })
      .eq("id", id)
    if (updateError) {
      console.error("Error updating plot point:", updateError)
      return fail(500, {
        action: actionName,
        id,
        error: `Database error: ${updateError.message}`,
      })
    }
    return {
      success: true,
      action: actionName,
      type: "plotPoint",
      message: "Plot point updated.",
    } // <<< Added action
  },
  deletePlotPoint: async ({ request, locals: { supabase, user }, params }) => {
    const actionName = "deletePlotPoint" // <<< Define action name
    if (!user) return fail(401, { action: actionName, message: "Unauthorized" })
    const formData = await request.formData()
    const id = formData.get("id")?.toString()
    if (!id)
      return fail(400, { action: actionName, error: "Plot point ID missing." })
    const { error: deleteError } = await supabase
      .from("project_plot_points")
      .delete()
      .eq("id", id)
    if (deleteError) {
      console.error("Error deleting plot point:", deleteError)
      return fail(500, {
        action: actionName,
        id,
        error: `Database error: ${deleteError.message}`,
      })
    }
    return {
      success: true,
      action: actionName,
      type: "plotPoint",
      deletedId: id,
      message: "Plot point deleted.",
    } // <<< Added action
  },
}
