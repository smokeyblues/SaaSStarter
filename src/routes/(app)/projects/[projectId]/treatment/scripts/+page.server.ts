import { error, fail, redirect } from "@sveltejs/kit"
import type { Actions, PageServerLoad } from "./$types"
import type { Database } from "../../../../../../DatabaseDefinitions" // Adjust path if needed

const ASSETS_BUCKET = "project-assets" // Make sure this matches your config

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

  // Fetch script assets metadata
  const scriptAssetsPromise = supabase
    .from("project_assets")
    .select("*")
    .eq("project_id", params.projectId)
    .eq("asset_category", "script") // Filter by the category
    .order("created_at", { ascending: true })

  // Run all data fetching in parallel
  const [{ data: scriptAssets, error: scriptAssetsError }] = await Promise.all([
    scriptAssetsPromise,
  ])

  // Check for critical errors (e.g., if RLS denied access unexpectedly)
  // Individual sections might fail gracefully, but log errors.
  if (scriptAssetsError)
    console.error("Error loading script assets:", scriptAssetsError.message)

  // Generate signed URLs for script assets (valid for a limited time)
  let scriptsWithUrls: ScriptAssetWithUrl[] = []
  if (scriptAssets?.length) {
    scriptsWithUrls = await Promise.all(
      scriptAssets.map(async (script): Promise<ScriptAssetWithUrl> => {
        // <<< Return type declared here
        const { data: urlData, error: urlError } = await supabase.storage
          .from(ASSETS_BUCKET)
          .createSignedUrl(script.file_path, 60 * 60) // 1 hour validity

        if (urlError) {
          console.error(
            `Error generating signed URL for ${script.file_path}:`,
            urlError.message,
          )
          return { ...script, url: null } // Return script even if URL fails
        }
        return { ...script, url: urlData.signedUrl }
      }),
    )
  }

  return {
    scripts: scriptsWithUrls, // Already defaults to [] if assets were null/empty
  }
}

export const actions: Actions = {
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
      .from("project_assets")
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
      .from("project_assets")
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
