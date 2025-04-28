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
  const userScenariosPromise = supabase
    .from("project_user_scenarios")
    .select("*")
    .eq("project_id", params.projectId)
    .order("order_index", { ascending: true })

  // Run all data fetching in parallel
  const [{ data: userScenarios, error: userScenariosError }] =
    await Promise.all([userScenariosPromise])

  // Check for critical errors (e.g., if RLS denied access unexpectedly)
  // Individual sections might fail gracefully, but log errors.

  if (userScenariosError)
    console.error("Error loading user scenarios:", userScenariosError.message)

  return {
    userScenarios: userScenarios ?? [],
  }
}

export const actions: Actions = {
  addUserScenario: async ({ request, locals: { supabase, user }, params }) => {
    const actionName = "addUserScenario" // <<< Define action name
    if (!user) return fail(401, { action: actionName, message: "Unauthorized" })
    if (!params.projectId)
      return fail(400, { action: actionName, message: "Project ID missing" })
    const formData = await request.formData()
    const description = formData.get("description")?.toString()?.trim()
    if (!description) {
      return fail(400, {
        action: actionName,
        description: "",
        error: "Scenario description cannot be empty.",
      })
    }
    const { count, error: countError } = await supabase
      .from("project_user_scenarios")
      .select("*", { count: "exact", head: true })
      .eq("project_id", params.projectId)
    if (countError) {
      console.error("Error counting user scenarios:", countError)
      return fail(500, {
        action: actionName,
        description,
        error: "Database error determining order.",
      })
    }
    const { error: insertError } = await supabase
      .from("project_user_scenarios")
      .insert({
        project_id: params.projectId,
        description: description,
        order_index: count ?? 0,
      })
    if (insertError) {
      console.error("Error adding user scenario:", insertError)
      return fail(500, {
        action: actionName,
        description,
        error: `Database error: ${insertError.message}`,
      })
    }
    return {
      success: true,
      action: actionName,
      type: "userScenario",
      message: "User scenario added.",
    } // <<< Added action
  },
  updateUserScenario: async ({
    request,
    locals: { supabase, user },
    params,
  }) => {
    const actionName = "updateUserScenario" // <<< Define action name
    if (!user) return fail(401, { action: actionName, message: "Unauthorized" })
    const formData = await request.formData()
    const id = formData.get("id")?.toString()
    const description = formData.get("description")?.toString()?.trim()
    if (!id)
      return fail(400, { action: actionName, error: "Scenario ID missing." })
    if (!description)
      return fail(400, {
        action: actionName,
        id,
        error: "Scenario description cannot be empty.",
      })
    const { error: updateError } = await supabase
      .from("project_user_scenarios")
      .update({ description: description })
      .eq("id", id)
    if (updateError) {
      console.error("Error updating user scenario:", updateError)
      return fail(500, {
        action: actionName,
        id,
        error: `Database error: ${updateError.message}`,
      })
    }
    return {
      success: true,
      action: actionName,
      type: "userScenario",
      message: "User scenario updated.",
    } // <<< Added action
  },
  deleteUserScenario: async ({
    request,
    locals: { supabase, user },
    params,
  }) => {
    const actionName = "deleteUserScenario" // <<< Define action name
    if (!user) return fail(401, { action: actionName, message: "Unauthorized" })
    const formData = await request.formData()
    const id = formData.get("id")?.toString()
    if (!id)
      return fail(400, { action: actionName, error: "Scenario ID missing." })
    const { error: deleteError } = await supabase
      .from("project_user_scenarios")
      .delete()
      .eq("id", id)
    if (deleteError) {
      console.error("Error deleting user scenario:", deleteError)
      return fail(500, {
        action: actionName,
        id,
        error: `Database error: ${deleteError.message}`,
      })
    }
    return {
      success: true,
      action: actionName,
      type: "userScenario",
      deletedId: id,
      message: "User scenario deleted.",
    } // <<< Added action
  },
}
