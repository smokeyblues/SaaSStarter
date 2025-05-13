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
  const designPromise = supabase
    .from("project_design_specs")
    .select("*")
    .eq("project_id", params.projectId)
    .maybeSingle() // Use maybeSingle as it might not exist yet

  const storyboardsPromise = supabase
    .from("project_storyboard_collections")
    .select("*")
    .eq("project_id", params.projectId)
    .order("order_index", { ascending: true })

  const wireframesPromise = supabase
    .from("project_wireframe_sets")
    .select("*")
    .eq("project_id", params.projectId)
    .order("order_index", { ascending: true })

  const assetsListPromise = supabase
    .from("project_assets")
    .select("*")
    .eq("project_id", params.projectId)
    .order("order_index", { ascending: true })

  // Run all data fetching in parallel
  const [
    { data: design, error: designError },
    { data: storyboards, error: storyboardsError },
    { data: wireframes, error: wireframesError },
    { data: assetsList, error: assetsListError },
  ] = await Promise.all([
    designPromise,
    storyboardsPromise,
    wireframesPromise,
    assetsListPromise,
  ])

  // Check for critical errors (e.g., if RLS denied access unexpectedly)
  // Individual sections might fail gracefully, but log errors.
  if (designError) console.error("Error loading design:", designError.message)
  if (storyboardsError)
    console.error("Error loading storyboards:", storyboardsError.message)
  if (wireframesError)
    console.error("Error loading wireframes:", wireframesError.message)
  if (assetsListError)
    console.error("Error loading assets list:", assetsListError.message)

  // If treatment loading failed badly, maybe we should error out? Depends on requirements.
  // if (treatmentError && treatmentError.code !== 'PGRST116') { // PGRST116 = Range Not Satisfiable (empty)
  //    error(500, `Failed to load core treatment data: ${treatmentError.message}`);
  // }

  // Generate signed URLs for script assets (valid for a limited time)
  // let scriptsWithUrls: ScriptAssetWithUrl[] = []
  // if (scriptAssets?.length) {
  //   scriptsWithUrls = await Promise.all(
  //     scriptAssets.map(async (script): Promise<ScriptAssetWithUrl> => {
  //       // <<< Return type declared here
  //       const { data: urlData, error: urlError } = await supabase.storage
  //         .from(ASSETS_BUCKET)
  //         .createSignedUrl(script.file_path, 60 * 60) // 1 hour validity

  //       if (urlError) {
  //         console.error(
  //           `Error generating signed URL for ${script.file_path}:`,
  //           urlError.message,
  //         )
  //         return { ...script, url: null } // Return script even if URL fails
  //       }
  //       return { ...script, url: urlData.signedUrl }
  //     }),
  //   )
  // }

  return {
    // Ensure we pass back null or data, never undefined for treatment
    design: design ?? null,
    storyboards: storyboards ?? [],
    wireframes: wireframes ?? [],
    assetsList: assetsList ?? [],
  }
}

export const actions: Actions = {
  saveDesignText: async ({ request, locals: { supabase, user }, params }) => {
    const actionName = "saveDesignText" // <<< Define action name
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
      "aesthetic",
      "branding",
      "style_guide",
      "media_styles",
      "assets_list",
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
      .from("project_design_specs")
      .upsert(
        { project_id: params.projectId, [field]: contentString },
        { onConflict: "project_id" },
      )

    if (upsertError) {
      console.error(`Error saving design field '${field}':`, upsertError)
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

  addStoryboard: async ({ request, locals: { supabase, user }, params }) => {
    const actionName = "addStoryboard" // <<< Define action name
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
      .from("project_storyboard_collections")
      .select("*", { count: "exact", head: true })
      .eq("project_id", params.projectId)
    if (countError) {
      console.error("Error counting storyboards:", countError)
      return fail(500, {
        action: actionName,
        description,
        error: "Database error determining order.",
      })
    }
    const { error: insertError } = await supabase
      .from("project_storyboard_collections")
      .insert({
        project_design_spec_id: params.projectId,
        title: description,
        description: description,
        order_index: count ?? 0,
      })
    if (insertError) {
      console.error("Error adding storyboards:", insertError)
      return fail(500, {
        action: actionName,
        description,
        error: `Database error: ${insertError.message}`,
      })
    }
    return {
      success: true,
      action: actionName,
      type: "storyboard",
      message: "Storyboards added.",
    } // <<< Added action
  },

  updateStoryboard: async ({ request, locals: { supabase, user }, params }) => {
    const actionName = "updateStoryboard" // <<< Define action name
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
      .from("project_storyboard_collections")
      .update({ description: description })
      .eq("id", id)
    if (updateError) {
      console.error("Error updating storyboards:", updateError)
      return fail(500, {
        action: actionName,
        id,
        error: `Database error: ${updateError.message}`,
      })
    }
    return {
      success: true,
      action: actionName,
      type: "storyboard",
      message: "Storyboards updated.",
    } // <<< Added action
  },

  deleteStoryboard: async ({ request, locals: { supabase, user }, params }) => {
    const actionName = "deleteStoryboard" // <<< Define action name
    if (!user) return fail(401, { action: actionName, message: "Unauthorized" })
    const formData = await request.formData()
    const id = formData.get("id")?.toString()
    if (!id)
      return fail(400, { action: actionName, error: "Storyboard ID missing." })
    const { error: deleteError } = await supabase
      .from("project_storyboard_collections")
      .delete()
      .eq("id", id)
    if (deleteError) {
      console.error("Error deleting storyboards:", deleteError)
      return fail(500, {
        action: actionName,
        id,
        error: `Database error: ${deleteError.message}`,
      })
    }
    return {
      success: true,
      action: actionName,
      type: "storyboard",
      deletedId: id,
      message: "Storyboards deleted.",
    } // <<< Added action
  },

  addWireframeSet: async ({ request, locals: { supabase, user }, params }) => {
    const actionName = "addWireframeSet" // <<< Define action name
    if (!user) return fail(401, { action: actionName, message: "Unauthorized" })
    if (!params.projectId)
      return fail(400, { action: actionName, message: "Project ID missing" })
    const formData = await request.formData()
    const description = formData.get("description")?.toString()?.trim()
    if (!description) {
      return fail(400, {
        action: actionName,
        description: "",
        error: "Wireframe description cannot be empty.",
      })
    }
    const { count, error: countError } = await supabase
      .from("project_wireframe_sets")
      .select("*", { count: "exact", head: true })
      .eq("project_design_spec_id", params.projectId)
    if (countError) {
      console.error("Error counting wireframe sets:", countError)
      return fail(500, {
        action: actionName,
        description,
        error: "Database error determining order.",
      })
    }
    const { error: insertError } = await supabase
      .from("project_wireframe_sets")
      .insert({
        project_design_spec_id: params.projectId,
        title: description,
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
      type: "wireframeSet",
      message: "Wireframe set added.",
    } // <<< Added action
  },

  updateWireframeSet: async ({
    request,
    locals: { supabase, user },
    params,
  }) => {
    const actionName = "updateWireframeSet" // <<< Define action name
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
      .from("project_wireframe_sets")
      .update({ description: description })
      .eq("id", id)
    if (updateError) {
      console.error("Error updating wireframe set:", updateError)
      return fail(500, {
        action: actionName,
        id,
        error: `Database error: ${updateError.message}`,
      })
    }
    return {
      success: true,
      action: actionName,
      type: "wireframeSet",
      message: "Wireframe set updated.",
    } // <<< Added action
  },

  deleteWireframeSet: async ({
    request,
    locals: { supabase, user },
    params,
  }) => {
    const actionName = "deleteWireframeSet" // <<< Define action name
    if (!user) return fail(401, { action: actionName, message: "Unauthorized" })
    const formData = await request.formData()
    const id = formData.get("id")?.toString()
    if (!id)
      return fail(400, {
        action: actionName,
        error: "Wireframe set ID missing.",
      })
    const { error: deleteError } = await supabase
      .from("project_wireframe_sets")
      .delete()
      .eq("id", id)
    if (deleteError) {
      console.error("Error deleting wireframe set:", deleteError)
      return fail(500, {
        action: actionName,
        id,
        error: `Database error: ${deleteError.message}`,
      })
    }
    return {
      success: true,
      action: actionName,
      type: "wireframeSet",
      deletedId: id,
      message: "Wireframe set deleted.",
    } // <<< Added action
  },

  recordStoryboardUpload: async ({
    request,
    locals: { supabase, user },
    params,
  }) => {
    const actionName = "recordStoryboardUpload" // <<< Define action name
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
      .from("project_assets")
      .insert({
        project_id: params.projectId,
        uploaded_by_user_id: user.id,
        file_name: fileName,
        file_path: filePath,
        file_type: fileType,
        size_bytes: fileSize,
        asset_category: "storyboard",
      })
    if (insertError) {
      console.error("Error recording storyboard asset:", insertError)
      return fail(500, {
        action: actionName,
        error: `Database error: ${insertError.message}`,
      })
    }
    return {
      success: true,
      action: actionName,
      type: "storyboardAsset",
      message: "Storyboard upload recorded.",
    } // <<< Added action
  },

  deleteWireframeSetAsset: async ({
    request,
    locals: { supabase, user },
    params,
  }) => {
    const actionName = "deleteWireframeSetAsset" // <<< Define action name
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
      .from("project_assets")
      .delete()
      .eq("id", assetId)
    if (dbError) {
      console.error(
        `Error deleting storyboard asset record (${assetId}):`,
        dbError,
      )
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
      type: "storyboardAsset",
      deletedId: assetId,
      message: "Storyboard deleted.",
    } // <<< Added action
  },

  recordWireframeSetUpload: async ({
    request,
    locals: { supabase, user },
    params,
  }) => {
    const actionName = "recordWireframeSetUpload" // <<< Define action name
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
      .from("project_assets")
      .insert({
        project_id: params.projectId,
        uploaded_by_user_id: user.id,
        file_name: fileName,
        file_path: filePath,
        file_type: fileType,
        size_bytes: fileSize,
        asset_category: "storyboard",
      })
    if (insertError) {
      console.error("Error recording storyboard asset:", insertError)
      return fail(500, {
        action: actionName,
        error: `Database error: ${insertError.message}`,
      })
    }
    return {
      success: true,
      action: actionName,
      type: "storyboardAsset",
      message: "Storyboard upload recorded.",
    } // <<< Added action
  },

  deleteWireframeSetObject: async ({
    request,
    locals: { supabase, user },
    params,
  }) => {
    const actionName = "deleteWireframeSetObject" // <<< Define action name
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
      .from("project_assets")
      .delete()
      .eq("id", assetId)
    if (dbError) {
      console.error(
        `Error deleting wireframe set asset record (${assetId}):`,
        dbError,
      )
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
      type: "wireframeSet",
      deletedId: assetId,
      message: "Wireframe set deleted.",
    } // <<< Added action
  },
}
