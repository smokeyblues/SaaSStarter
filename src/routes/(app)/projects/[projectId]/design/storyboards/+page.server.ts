// src/routes/(app)/projects/[projectId]/design/storyboards/+page.server.ts
import { fail, error, redirect } from "@sveltejs/kit"
import type { PageServerLoad, Actions } from "./$types"
import type { AssetCategory } from "$lib/types/assets"
// No nanoid needed here if client generates unique paths

// Assuming ASSETS_BUCKET is defined globally or imported
const ASSETS_BUCKET = "project-assets"

// Type for the metadata sent from the client
interface UploadedAssetMetadata {
  fileName: string
  filePath: string // This is the path in Supabase Storage
  fileType: string
  fileSize: number
}

export const load: PageServerLoad = async ({
  locals: { supabase, user },
  params,
}) => {
  if (!user) {
    throw redirect(303, "/login")
  }
  const projectId = params.projectId
  if (!projectId) {
    throw error(404, "Project not found")
  }

  // 1. Get or Create project_design_spec_id (Keep this logic as is)
  let projectDesignSpecId: string | undefined
  const { data: existingDesignSpec, error: existingDesignSpecError } =
    await supabase
      .from("project_design_specs")
      .select("id")
      .eq("project_id", projectId)
      .maybeSingle()

  if (existingDesignSpecError) {
    console.error(
      "Error checking for existing design spec:",
      existingDesignSpecError,
    )
    throw error(500, "Failed to check design specifications.")
  }

  if (existingDesignSpec) {
    projectDesignSpecId = existingDesignSpec.id
  } else {
    // (Keep your existing logic for creating project_design_specs if not found, including permission checks)
    const { data: projectOwnerTeam, error: projectTeamError } = await supabase
      .from("projects")
      .select("owner_team_id")
      .eq("id", projectId)
      .single()
    if (projectTeamError || !projectOwnerTeam) {
      throw error(
        projectTeamError ? 500 : 404,
        "Project not found or team unlinked.",
      )
    }
    const { data: membership, error: membershipError } = await supabase
      .from("team_memberships")
      .select("user_id")
      .eq("team_id", projectOwnerTeam.owner_team_id)
      .eq("user_id", user.id)
      .maybeSingle()
    if (membershipError || !membership) {
      throw error(
        membershipError ? 500 : 403,
        "Access denied to create design spec.",
      )
    }
    const { data: newDesignSpec, error: newDesignSpecError } = await supabase
      .from("project_design_specs")
      .insert({ project_id: projectId })
      .select("id")
      .single()
    if (newDesignSpecError) {
      throw error(500, "Could not initialize design specifications.")
    }
    projectDesignSpecId = newDesignSpec.id
  }

  if (!projectDesignSpecId) {
    throw error(500, "Critical error: Design Spec ID could not be determined.")
  }

  // 2. Fetch existing storyboard collections with their assets
  const { data: storyboardCollections, error: collectionsError } =
    await supabase
      .from("project_storyboard_collections")
      .select(
        `
            id,
            title,
            description,
            order_index,
            created_at,
            project_assets (
                id,
                file_name,
                file_path,
                file_type,
                size_bytes 
            )
        `,
      )
      .eq("project_design_spec_id", projectDesignSpecId)
      .order("order_index", { ascending: true })
      .order("created_at", { foreignTable: "project_assets", ascending: true }) // Corrected: referencingTable

  if (collectionsError) {
    console.error("Error fetching storyboard collections:", collectionsError)
    throw error(500, "Failed to load storyboard collections.")
  }

  // 3. Generate signed URLs for each asset
  const collectionsWithSignedUrls = await Promise.all(
    (storyboardCollections || []).map(async (collection) => {
      const assetsWithUrls = await Promise.all(
        (collection.project_assets || []).map(async (asset) => {
          if (!asset.file_path) return { ...asset, url: null }
          const { data: urlData, error: urlError } = await supabase.storage
            .from(ASSETS_BUCKET)
            .createSignedUrl(asset.file_path, 60 * 5) // 5 minutes validity for display

          if (urlError) {
            console.error(
              `Error creating signed URL for ${asset.file_path}:`,
              urlError.message,
            )
            return { ...asset, url: null }
          }
          return { ...asset, url: urlData.signedUrl }
        }),
      )
      return { ...collection, project_assets: assetsWithUrls }
    }),
  )

  return {
    projectId,
    storyboardCollections: collectionsWithSignedUrls || [], // Use data with signed URLs
    projectDesignSpecId,
  }
}

export const actions: Actions = {
  createStoryboardCollection: async ({
    request,
    locals: { supabase, user },
    params,
  }) => {
    const actionName = "createStoryboardCollection"
    if (!user) return fail(401, { action: actionName, error: "Unauthorized" })

    const projectId = params.projectId
    const formData = await request.formData()

    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const uploadedAssetsJson = formData.get("uploadedAssets") as string // This is now a JSON string

    if (!title || title.trim() === "") {
      return fail(400, {
        action: actionName,
        error: "Title is required.",
        title,
        description,
        projectId,
      })
    }

    let uploadedAssets: UploadedAssetMetadata[] = []
    if (uploadedAssetsJson) {
      try {
        uploadedAssets = JSON.parse(uploadedAssetsJson)
      } catch (e) {
        return fail(400, {
          action: actionName,
          error: "Invalid asset data format.",
          title,
          description,
          projectId,
        })
      }
    }

    if (!uploadedAssets || uploadedAssets.length === 0) {
      return fail(400, {
        action: actionName,
        error: "At least one storyboard image must be uploaded and provided.",
        title,
        description,
        projectId,
      })
    }

    // --- Logic to get or create project_design_spec_id (Keep this logic as is from your original file) ---
    let projectDesignSpecId: string | undefined
    // (Paste your existing logic for getting/creating projectDesignSpecId here, including permission checks)
    const { data: existingDesignSpec, error: checkError } = await supabase
      .from("project_design_specs")
      .select("id")
      .eq("project_id", projectId)
      .maybeSingle()
    if (checkError)
      return fail(500, {
        action: actionName,
        error: "DB error checking design spec.",
        title,
        description,
        projectId,
      })
    if (existingDesignSpec) {
      projectDesignSpecId = existingDesignSpec.id
    } else {
      const { data: pTeam, error: pTeamErr } = await supabase
        .from("projects")
        .select("owner_team_id")
        .eq("id", projectId)
        .single()
      if (pTeamErr || !pTeam)
        return fail(pTeamErr ? 500 : 404, {
          action: actionName,
          error: "Project not found for design spec creation.",
          title,
          description,
          projectId,
        })
      const { data: mem, error: memErr } = await supabase
        .from("team_memberships")
        .select("user_id")
        .eq("team_id", pTeam.owner_team_id)
        .eq("user_id", user.id)
        .maybeSingle()
      if (memErr || !mem)
        return fail(memErr ? 500 : 403, {
          action: actionName,
          error: "Permission denied to create design spec.",
          title,
          description,
          projectId,
        })
      const { data: newDS, error: insErr } = await supabase
        .from("project_design_specs")
        .insert({ project_id: projectId })
        .select("id")
        .single()
      if (insErr)
        return fail(500, {
          action: actionName,
          error: "Could not initialize design spec.",
          title,
          description,
          projectId,
        })
      projectDesignSpecId = newDS.id
    }
    if (!projectDesignSpecId)
      return fail(500, {
        action: actionName,
        error: "Critical: Design Spec ID missing.",
        title,
        description,
        projectId,
      })
    // --- End logic ---

    // 1. Create the storyboard collection record
    const { data: newCollection, error: collectionError } = await supabase
      .from("project_storyboard_collections")
      .insert({
        project_design_spec_id: projectDesignSpecId,
        title: title.trim(),
        description: description?.trim(),
      })
      .select("id")
      .single()

    if (collectionError) {
      console.error("Error creating storyboard collection:", collectionError)
      // If collection creation fails, we should also attempt to delete the already uploaded files from storage
      const pathsToRemove = uploadedAssets.map((asset) => asset.filePath)
      if (pathsToRemove.length > 0) {
        await supabase.storage.from(ASSETS_BUCKET).remove(pathsToRemove)
      }
      return fail(500, {
        action: actionName,
        error: `Could not create storyboard collection: ${collectionError.message}`,
        title,
        description,
        projectId,
      })
    }

    // 2. Link uploaded assets (metadata) to the new collection
    const assetRecordsToInsert = uploadedAssets.map((asset) => ({
      project_id: projectId,
      uploaded_by_user_id: user.id,
      file_name: asset.fileName,
      file_path: asset.filePath,
      file_type: asset.fileType,
      size_bytes: asset.fileSize,
      storyboard_collection_id: newCollection.id, // Link to the newly created collection
      asset_category: "storyboard" as AssetCategory,
      design_subsection_tag: "storyboard", // Tag it appropriately
    }))

    const { error: assetDbError } = await supabase
      .from("project_assets")
      .insert(assetRecordsToInsert)

    if (assetDbError) {
      console.error("Error saving asset records for collection:", assetDbError)
      // Critical: DB failed. Rollback collection creation & try to delete storage files.
      await supabase
        .from("project_storyboard_collections")
        .delete()
        .eq("id", newCollection.id)
      const pathsToRemove = uploadedAssets.map((asset) => asset.filePath)
      if (pathsToRemove.length > 0) {
        await supabase.storage.from(ASSETS_BUCKET).remove(pathsToRemove)
      }
      return fail(500, {
        action: actionName,
        error: `Failed to save asset records: ${assetDbError.message}`,
        title,
        description,
        projectId,
      })
    }

    return {
      success: true,
      action: actionName,
      type: "storyboardCollection", // For form handling on client
      message: "Storyboard collection and images recorded successfully!",
      newCollectionId: newCollection.id, // For potential UI updates
      projectId,
    }
  },

  // --- IMPORTANT: Review and update other actions (updateStoryboardCollection, deleteStoryboardCollection, deleteStoryboardAsset) ---
  // They need to be consistent with the overall structure and not expect direct file uploads.
  // For example, deleteStoryboardCollection needs to iterate over its `project_assets` to delete them from storage.
  updateStoryboardCollection: async ({
    request,
    locals: { supabase, user },
    params,
  }) => {
    // ... (Keep this action largely the same as it updates title/description, not files)
    // Ensure permission checks are robust.
    const actionName = "updateStoryboardCollection"
    if (!user)
      return fail(401, {
        action: actionName,
        message: "Unauthorized",
        projectId: params.projectId,
      })
    const formData = await request.formData()
    const id = formData.get("id")?.toString()
    const title = formData.get("title")?.toString()?.trim()
    const description = formData.get("description")?.toString()?.trim()

    if (!id)
      return fail(400, {
        action: actionName,
        error: "Collection ID missing.",
        projectId: params.projectId,
      })
    if (!title)
      return fail(400, {
        action: actionName,
        error: "Title cannot be empty.",
        id,
        title,
        description,
        projectId: params.projectId,
      })

    // Add permission check here: user must be a member of the project this collection belongs to.
    // This typically involves joining project_storyboard_collections -> project_design_specs -> projects -> team_memberships

    const { error: updateError } = await supabase
      .from("project_storyboard_collections")
      .update({ title, description, updated_at: new Date().toISOString() })
      .eq("id", id) // RLS should also enforce this

    if (updateError) {
      console.error("Error updating storyboard collection:", updateError)
      return fail(500, {
        action: actionName,
        id,
        error: `Database error: ${updateError.message}`,
        projectId: params.projectId,
      })
    }
    return {
      success: true,
      action: actionName,
      type: "storyboardCollection",
      message: "Storyboard collection updated.",
      projectId: params.projectId,
    }
  },

  deleteStoryboardCollection: async ({
    request,
    locals: { supabase, user },
    params,
  }) => {
    // ... (Keep this action but ensure it correctly finds and deletes assets from storage FIRST, then DB records)
    const actionName = "deleteStoryboardCollection"
    if (!user)
      return fail(401, {
        action: actionName,
        message: "Unauthorized",
        projectId: params.projectId,
      })
    const formData = await request.formData()
    const id = formData.get("id")?.toString() // This is project_storyboard_collections.id
    if (!id)
      return fail(400, {
        action: actionName,
        error: "Collection ID missing.",
        projectId: params.projectId,
      })

    // Add permission check here.

    // 1. Find all asset file_paths associated with this collection
    const { data: assets, error: assetsError } = await supabase
      .from("project_assets")
      .select("file_path")
      .eq("storyboard_collection_id", id)

    if (assetsError) {
      console.error(
        "Error fetching assets for collection deletion:",
        assetsError,
      )
      return fail(500, {
        action: actionName,
        id,
        error: `DB error: ${assetsError.message}`,
        projectId: params.projectId,
      })
    }

    // 2. Delete files from storage
    if (assets && assets.length > 0) {
      const filePaths = assets
        .map((a) => a.file_path)
        .filter(Boolean) as string[]
      if (filePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from(ASSETS_BUCKET)
          .remove(filePaths)
        if (storageError) {
          // Log error but proceed to delete DB records, as partial failure is better than orphaned DB entries
          console.warn(
            `Storage deletion error for collection ${id}:`,
            storageError.message,
          )
        }
      }
    }

    // 3. Delete asset records from project_assets (DB cascade delete should handle this if storyboard_collection_id is FK)
    // If no cascade, delete explicitly:
    const { error: assetDbDeleteError } = await supabase
      .from("project_assets")
      .delete()
      .eq("storyboard_collection_id", id)

    if (assetDbDeleteError) {
      console.error(
        "Error deleting asset records for collection:",
        assetDbDeleteError,
      )
      // At this point, storage *may* have been cleaned. This is an inconsistent state.
      return fail(500, {
        action: actionName,
        id,
        error: `Error deleting asset DB records: ${assetDbDeleteError.message}`,
        projectId: params.projectId,
      })
    }

    // 4. Delete the collection record itself
    const { error: collectionError } = await supabase
      .from("project_storyboard_collections")
      .delete()
      .eq("id", id)

    if (collectionError) {
      console.error(
        "Error deleting storyboard collection record:",
        collectionError,
      )
      return fail(500, {
        action: actionName,
        id,
        error: `Error deleting collection DB record: ${collectionError.message}`,
        projectId: params.projectId,
      })
    }

    return {
      success: true,
      action: actionName,
      type: "storyboardCollection",
      deletedId: id,
      message: "Storyboard collection deleted.",
      projectId: params.projectId,
    }
  },

  deleteStoryboardAsset: async ({
    request,
    locals: { supabase, user },
    params,
  }) => {
    // ... (This action should be mostly fine as is, since it deals with a single asset)
    // Ensure permission checks are robust.
    const actionName = "deleteStoryboardAsset"
    if (!user)
      return fail(401, {
        action: actionName,
        message: "Unauthorized",
        projectId: params.projectId,
      })
    const formData = await request.formData()
    const assetId = formData.get("assetId")?.toString()
    const filePath = formData.get("filePath")?.toString()

    if (!assetId || !filePath)
      return fail(400, {
        action: actionName,
        error: "Missing asset ID or file path.",
        projectId: params.projectId,
      })

    // Add permission check: user must be member of project this asset belongs to.

    const { error: storageError } = await supabase.storage
      .from(ASSETS_BUCKET)
      .remove([filePath])
    if (storageError) {
      // Log warning but proceed, DB record deletion is more critical if storage fails
      console.warn(
        `Storage deletion warning for ${filePath} (assetId: ${assetId}):`,
        storageError.message,
      )
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
        projectId: params.projectId,
      })
    }
    return {
      success: true,
      action: actionName,
      type: "storyboardAsset",
      deletedId: assetId,
      message: "Storyboard image deleted.",
      projectId: params.projectId,
    }
  },
}
