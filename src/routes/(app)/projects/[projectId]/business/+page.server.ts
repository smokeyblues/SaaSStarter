// src/routes/(app)/projects/[projectId]/business/+page.server.ts
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

// Define the type for business details (adjust path if needed)

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
  const { data: businessDetails, error: detailsError } = await supabase
    .from("project_business_details")
    .select("*")
    .eq("project_id", params.projectId)
    .maybeSingle() // Use maybeSingle as details might not exist yet

  if (detailsError) {
    // Log the error but don't necessarily block the page load unless it's critical
    // RLS might return an error if the user doesn't have access, which is expected
    console.error(
      "Error loading project business details:",
      detailsError.message,
    )
    // Optionally, you could throw an error if the error indicates a real problem:
    // if (detailsError.code !== 'PGRST116') { // PGRST116 = Range Not Satisfiable (empty)
    //     error(500, `Failed to load business details: ${detailsError.message}`)
    // }
  }

  return {
    // Ensure we pass back null or the data, matching the expected type
    businessDetails: businessDetails ?? null,
  }
}

export const actions: Actions = {
  saveBusinessDetail: async ({
    request,
    locals: { supabase, user },
    params,
  }) => {
    const actionName = "saveBusinessDetail" // Identify the action
    if (!user) return fail(401, { action: actionName, message: "Unauthorized" })
    if (!params.projectId)
      return fail(400, { action: actionName, message: "Project ID missing" })

    const formData = await request.formData()
    const field = formData.get("field")?.toString()
    const content = formData.get("content")

    // Validate the field name
    const allowedFields: Array<
      keyof Omit<
        Database["public"]["Tables"]["project_business_details"]["Row"],
        "id" | "project_id" | "created_at" | "updated_at"
      >
    > = [
      "goals_user",
      "goals_creative",
      "goals_economic",
      "success_indicators",
      "target_audience",
      "user_need",
      "business_models", // Include other fields if they will use this action
    ]

    if (!field || !allowedFields.includes(field as any)) {
      return fail(400, {
        action: actionName,
        field,
        error: "Invalid or missing field specified",
      })
    }

    // Allow empty string for content, but not null/undefined
    if (content === null || content === undefined) {
      return fail(400, {
        action: actionName,
        field,
        error: "Missing content value",
      })
    }
    const contentString = content.toString()

    // Upsert the data into the project_business_details table
    const { error: upsertError } = await supabase
      .from("project_business_details")
      .upsert(
        {
          project_id: params.projectId,
          // Use computed property name to set the correct field
          [field]: contentString,
        },
        {
          // Specify the conflict target (the unique constraint)
          onConflict: "project_id",
        },
      )

    if (upsertError) {
      console.error(
        `Error saving business detail field '${field}':`,
        upsertError,
      )
      // Provide more specific feedback if possible (e.g., check error code)
      return fail(500, {
        action: actionName,
        field,
        error: `Database error: ${upsertError.message}`,
      })
    }

    // Success!
    return {
      success: true,
      action: actionName,
      field, // Return the field that was updated
      message: `${field.replace(/_/g, " ")} saved successfully.`, // User-friendly message
    }
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
