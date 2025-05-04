// src/routes/(app)/projects/[projectId]/treatment/+page.server.ts
import { error, fail, redirect } from "@sveltejs/kit"
import type { Actions, PageServerLoad } from "./$types"
import type { Database } from "../../../../../DatabaseDefinitions" // Adjust path if needed

// --- Ensure you have your bucket name configured ---
const ASSETS_BUCKET = "project-assets" // <<< IMPORTANT: Replace with your actual bucket name

// --- Define the type for script assets with the optional signed URL ---
type ScriptAsset = Database["public"]["Tables"]["project_assets"]["Row"] // Base type from DB definitions

interface ScriptAssetWithUrl extends ScriptAsset {
  url: string | null // Add the url property, allowing null if generation fails
}

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
  const businessPromise = supabase
    .from("project_business_details")
    .select("*")
    .eq("project_id", params.projectId)
    .maybeSingle() // Use maybeSingle as it might not exist yet

  const goalsPromise = supabase
    .from("project_business_details")
    .select("goals_user, goals_creative, goals_economic")
    .eq("project_id", params.projectId)

  const successIndicatorsPromise = supabase
    .from("project_business_details")
    .select("*")
    .eq("project_id", params.projectId)

  // Fetch script assets metadata
  const audiencePromise = supabase
    .from("project_business_details")
    .select("*")
    .eq("project_id", params.projectId)
    .eq("asset_category", "script") // Filter by the category
    .order("created_at", { ascending: true })

  // Run all data fetching in parallel
  const [
    { data: business, error: businessError },
    { data: goals, error: goalsError },
    { data: successIndicators, error: successIndicatorsError },
    { data: audience, error: audienceError },
  ] = await Promise.all([
    businessPromise,
    goalsPromise,
    successIndicatorsPromise,
    audiencePromise,
  ])

  // Check for critical errors (e.g., if RLS denied access unexpectedly)
  // Individual sections might fail gracefully, but log errors.
  if (businessError)
    console.error("Error loading business:", businessError.message)
  if (goalsError) console.error("Error loading goals:", goalsError.message)
  if (successIndicatorsError)
    console.error(
      "Error loading success indicators:",
      successIndicatorsError.message,
    )

  return {
    // Ensure we pass back null or data, never undefined for treatment
    business: business ?? null,
    goals: goals ?? [],
    successIndicators: successIndicators ?? [],
    audience: audience ?? [],
  }
}

export const actions: Actions = {
  saveBusinessText: async ({ request, locals: { supabase, user }, params }) => {
    const actionName = "saveBusinessText" // <<< Define action name
    if (!user) return fail(401, { action: actionName, message: "Unauthorized" })
    if (!params.projectId)
      return fail(400, { action: actionName, message: "Project ID missing" })

    const formData = await request.formData()
    const field = formData.get("field")?.toString()
    const content = formData.get("content")

    if (!field || content === null || content === undefined) {
      return fail(400, {
        action: actionName,
        field,
        error: "Missing field or content value",
      })
    }
    const allowedFields = [
      "tagline",
      "backstory_context",
      "synopsis",
      "characterization_attitude",
    ]
    if (!allowedFields.includes(field)) {
      return fail(400, {
        action: actionName,
        field,
        error: "Invalid field specified",
      })
    }
    const contentString = content.toString()

    const { error: upsertError } = await supabase
      .from("project_business_details")
      .upsert(
        { project_id: params.projectId, [field]: contentString },
        { onConflict: "project_id" },
      )

    if (upsertError) {
      console.error(`Error saving business field '${field}':`, upsertError)
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
      message: `${field.replace(/_/g, " ")} saved.`,
    } // <<< Added action
  },

  addGoal: async ({ request, locals: { supabase, user }, params }) => {
    const actionName = "addGoal" // <<< Define action name
    if (!user) return fail(401, { action: actionName, message: "Unauthorized" })
    if (!params.projectId)
      return fail(400, { action: actionName, message: "Project ID missing" })
    const formData = await request.formData()
    const description = formData.get("description")?.toString()?.trim()
    if (!description) {
      return fail(400, {
        action: actionName,
        description: "",
        error: "Goal description cannot be empty.",
      })
    }
    const { count, error: countError } = await supabase
      .from("project_business_details")
      .select("*", { count: "exact", head: true })
      .eq("project_id", params.projectId)
    if (countError) {
      console.error("Error counting goals:", countError)
      return fail(500, {
        action: actionName,
        description,
        error: "Database error determining order.",
      })
    }
    const { error: insertError } = await supabase
      .from("project_business_details")
      .insert({
        project_id: params.projectId,
        description: description,
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
      type: "goal",
      message: "Goal added.",
    } // <<< Added action
  },

  updateGoal: async ({ request, locals: { supabase, user }, params }) => {
    const actionName = "updateGoal" // <<< Define action name
    if (!user) return fail(401, { action: actionName, message: "Unauthorized" })
    const formData = await request.formData()
    const id = formData.get("id")?.toString()
    const description = formData.get("description")?.toString()?.trim()
    if (!id) return fail(400, { action: actionName, error: "Goal ID missing." })
    if (!description)
      return fail(400, {
        action: actionName,
        id,
        error: "Goal description cannot be empty.",
      })
    const { error: updateError } = await supabase
      .from("project_business_details")
      .update({ goals_user: description })
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
      type: "goal",
      message: "Goal updated.",
    } // <<< Added action
  },

  deleteGoal: async ({ request, locals: { supabase, user }, params }) => {
    const actionName = "deleteGoal" // <<< Define action name
    if (!user) return fail(401, { action: actionName, message: "Unauthorized" })
    const formData = await request.formData()
    const id = formData.get("id")?.toString()
    if (!id)
      return fail(400, { action: actionName, error: "Plot point ID missing." })
    const { error: deleteError } = await supabase
      .from("project_business_details")
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
      type: "goal",
      deletedId: id,
      message: "Goal deleted.",
    } // <<< Added action
  },

  addSuccessIndicator: async ({
    request,
    locals: { supabase, user },
    params,
  }) => {
    const actionName = "addSuccessIndicator" // <<< Define action name
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
      .from("project_business_details")
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
      .from("project_business_details")
      .insert({
        project_id: params.projectId,
        description: description,
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
      type: "successIndicator",
      message: "Success indicator added.",
    } // <<< Added action
  },

  updateSuccessIndicator: async ({
    request,
    locals: { supabase, user },
    params,
  }) => {
    const actionName = "updateSuccessIndicator" // <<< Define action name
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
      .from("project_business_details")
      .update({ success_indicators: description })
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
      type: "successIndicator",
      message: "Success indicator updated.",
    } // <<< Added action
  },

  deleteSuccessIndicator: async ({
    request,
    locals: { supabase, user },
    params,
  }) => {
    const actionName = "deleteSuccessIndicator" // <<< Define action name
    if (!user) return fail(401, { action: actionName, message: "Unauthorized" })
    const formData = await request.formData()
    const id = formData.get("id")?.toString()
    if (!id)
      return fail(400, { action: actionName, error: "Scenario ID missing." })
    const { error: deleteError } = await supabase
      .from("project_business_details")
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
      type: "successIndicator",
      deletedId: id,
      message: "Success indicator deleted.",
    } // <<< Added action
  },

  recordScriptUpload: async ({
    request,
    locals: { supabase, user },
    params,
  }) => {
    const actionName = "recordScriptUpload" // <<< Define action name
    if (!user) return fail(401, { action: actionName, message: "Unauthorized" })
    if (!params.projectId)
      return fail(400, { action: actionName, message: "Project ID missing" })
    const formData = await request.formData()
    const fileName = formData.get("fileName")?.toString()
    const filePath = formData.get("filePath")?.toString()
    const fileType = formData.get("fileType")?.toString()
    const fileSizeStr = formData.get("fileSize")?.toString()
    const fileSize = fileSizeStr ? parseInt(fileSizeStr) : 0
    if (!fileName || !filePath) {
      return fail(400, {
        action: actionName,
        error: "Missing file name or storage path.",
      })
    }
    if (isNaN(fileSize)) {
      return fail(400, {
        action: actionName,
        error: "Invalid file size provided.",
      })
    }
    const { error: insertError } = await supabase
      .from("project_business_details")
      .insert({
        project_id: params.projectId,
        uploaded_by_user_id: user.id,
        file_name: fileName,
        file_path: filePath,
        file_type: fileType,
        size_bytes: fileSize,
        asset_category: "script",
      })
    if (insertError) {
      console.error("Error recording script asset:", insertError)
      return fail(500, {
        action: actionName,
        error: `Database error: ${insertError.message}`,
      })
    }
    return {
      success: true,
      action: actionName,
      type: "scriptAsset",
      message: "Script upload recorded.",
    } // <<< Added action
  },

  deleteScript: async ({ request, locals: { supabase, user }, params }) => {
    const actionName = "deleteScript" // <<< Define action name
    if (!user) return fail(401, { action: actionName, message: "Unauthorized" })
    const formData = await request.formData()
    const assetId = formData.get("assetId")?.toString()
    const filePath = formData.get("filePath")?.toString()
    if (!assetId || !filePath) {
      return fail(400, {
        action: actionName,
        error: "Missing required asset ID or file path.",
      })
    }
    const { error: dbError } = await supabase
      .from("project_business_details")
      .delete()
      .eq("id", assetId)
    if (dbError) {
      console.error(`Error deleting script asset record (${assetId}):`, dbError)
      return fail(500, {
        action: actionName,
        assetId,
        error: `Database error: ${dbError.message}`,
      })
    }
    const { error: storageError } = await supabase.storage
      .from(ASSETS_BUCKET)
      .remove([filePath])
    if (storageError) {
      console.warn(
        `Storage deletion error for ${filePath} (DB record deleted):`,
        storageError.message,
      )
    }
    return {
      success: true,
      action: actionName,
      type: "scriptAsset",
      deletedId: assetId,
      message: "Script deleted.",
    } // <<< Added action
  },
}
