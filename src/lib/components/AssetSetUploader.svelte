<!-- AssetSetUploader.svelte (Revised) -->
<script lang="ts">
  import { page } from "$app/stores"
  import type { SupabaseClient } from "@supabase/supabase-js"
  import type { AssetCategory } from "$lib/types/assets"
  import type { Database } from "../../DatabaseDefinitions" // Adjust path
  import { nanoid } from "nanoid" // For unique file names

  // --- Props ---
  const {
    actionUrl, // e.g., "?/createStoryboardCollection"
    bucketName = "project-assets",
    acceptedFileTypes = "image/*",
    onUploadSuccess, // Callback after DB record action succeeds
  }: {
    actionUrl: string
    bucketName?: string
    acceptedFileTypes?: string
    onUploadSuccess?: (data?: any) => void // Optional: pass back action result
  } = $props()

  // --- Supabase & User Context ---
  const supabase: SupabaseClient<Database> = $page.data.supabase // Assumes supabase client is in $page.data
  const user = $derived($page.data.user)
  const projectId = $derived($page.params.projectId)

  // --- Component State ---
  let title = $state("")
  let description = $state("")
  let selectedFiles: File[] = $state([])
  let assetCategory: AssetCategory = $state("storyboard")
  let formMessage = $state("")
  let formError = $state("")
  let isSubmitting = $state(false)
  let overallProgress = $state(0) // For overall progress
  let individualProgress: { [key: string]: number } = $state({}) // For individual file progress

  function handleFileChange(event: Event) {
    const input = event.target as HTMLInputElement
    selectedFiles = input.files ? Array.from(input.files) : []
    formError = ""
    formMessage = ""
    overallProgress = 0
    individualProgress = {}
  }

  async function handleSubmit(event: Event) {
    event.preventDefault()
    formMessage = ""
    formError = ""

    if (!user || !projectId) {
      formError =
        "User or Project information is missing. Please re-authenticate."
      return
    }
    if (!title.trim()) {
      formError = "Collection Title is required."
      return
    }
    if (!selectedFiles.length) {
      formError = "Please select at least one image."
      return
    }

    isSubmitting = true
    overallProgress = 0

    // --- 1. Upload files to Supabase Storage ---
    const uploadedAssetsMetadata: {
      fileName: string
      filePath: string
      fileType: string
      fileSize: number
    }[] = []
    const storageUploadPromises: Promise<void>[] = []
    const totalFiles = selectedFiles.length
    let filesUploadedSuccessfully = 0

    for (const file of selectedFiles) {
      individualProgress[file.name] = 0 // Initialize progress for this file

      const fileExt = file.name.split(".").pop()
      const uniqueFileName = `${projectId}/${user.id}/${assetCategory}/${nanoid()}-${file.name.replace(
        /\.[^/.]+$/,
        "",
      )}.${fileExt}` // Project/User/Category/nanoid-filename.ext

      const uploadPromise = supabase.storage
        .from(bucketName)
        .upload(uniqueFileName, file, {
          cacheControl: "3600",
          upsert: false,
          // TODO: Add progress tracking here if Supabase client supports it easily for individual files
          // onProgress: (event) => {
          //     if (event.lengthComputable) {
          //         const progress = Math.round((event.loaded / event.total) * 100);
          //         individualProgress[file.name] = progress;
          //         // Update overall progress (simple average for now)
          //         let currentTotalProgress = 0;
          //         Object.values(individualProgress).forEach(p => currentTotalProgress += p);
          //         overallProgress = Math.round(currentTotalProgress / totalFiles);
          //     }
          // }
        })
        .then(({ data: uploadData, error: uploadError }) => {
          if (uploadError) {
            console.error(`Error uploading ${file.name}:`, uploadError)
            // Collect individual errors if needed, or just fail the whole batch
            throw new Error(
              `Failed to upload ${file.name}: ${uploadError.message}`,
            )
          }
          if (!uploadData?.path) {
            throw new Error(
              `Upload of ${file.name} completed but no file path returned.`,
            )
          }
          uploadedAssetsMetadata.push({
            fileName: file.name,
            filePath: uploadData.path,
            fileType: file.type,
            fileSize: file.size,
          })
          filesUploadedSuccessfully++
          individualProgress[file.name] = 100 // Mark as complete
          overallProgress = Math.round(
            (filesUploadedSuccessfully / totalFiles) * 100,
          )
        })
      storageUploadPromises.push(uploadPromise)
    }

    try {
      await Promise.all(storageUploadPromises)
      // All files attempted upload. Proceed only if all were successful (or adjust logic for partial success)
      if (uploadedAssetsMetadata.length !== totalFiles) {
        // This implies some uploads failed and threw an error caught by the outer catch.
        // If Promise.all doesn't rethrow the first error, add a check here.
        throw new Error(
          "Not all files were uploaded successfully. Please check console for details.",
        )
      }

      // --- 2. Send metadata to Server Action ---
      const actionFormData = new FormData()
      actionFormData.append("title", title)
      actionFormData.append("description", description)
      // Send uploaded assets metadata as a JSON string
      actionFormData.append(
        "uploadedAssets",
        JSON.stringify(uploadedAssetsMetadata),
      )

      const response = await fetch(actionUrl, {
        method: "POST",
        body: actionFormData,
        // No 'enctype' needed as we are not sending files directly via fetch
      })

      const result = await response.json() // SvelteKit actions typically return JSON

      if (!response.ok || result.error || result.type === "failure") {
        formError =
          result.error ||
          result.message ||
          "Failed to create collection record."
        // Attempt to clean up storage if DB record fails
        if (uploadedAssetsMetadata.length > 0) {
          console.warn(
            `DB record failed for collection ${title}, attempting storage cleanup of ${uploadedAssetsMetadata.length} files...`,
          )
          const pathsToRemove = uploadedAssetsMetadata.map(
            (asset) => asset.filePath,
          )
          try {
            const { error: cleanupError } = await supabase.storage
              .from(bucketName)
              .remove(pathsToRemove)
            if (cleanupError)
              console.error("Storage cleanup failed:", cleanupError)
            else console.log("Orphaned storage files removed.")
          } catch (cleanupException) {
            console.error("Exception during storage cleanup:", cleanupException)
          }
        }
      } else {
        formMessage =
          result.message ||
          "Collection created and images recorded successfully!"
        title = ""
        description = ""
        selectedFiles = [] // Clear selection
        // Consider how to clear the file input visually if needed:
        // const fileInputEl = document.getElementById('asset-files') as HTMLInputElement;
        // if (fileInputEl) fileInputEl.value = "";

        if (onUploadSuccess) onUploadSuccess(result) // Pass action result data
      }
    } catch (e: any) {
      formError = `Upload process failed: ${e.message || String(e)}`
      // Cleanup logic here is tricky if some files uploaded and others didn't before the error.
      // The `createStoryboardCollection` action should ideally be robust enough to handle this or perform cleanup.
    } finally {
      isSubmitting = false
      overallProgress = 0 // Reset progress
      individualProgress = {}
    }
  }
</script>

<!-- Removed enctype, not needed for this approach -->
<form class="card bg-base-200 shadow-md p-6 space-y-4" onsubmit={handleSubmit}>
  <h2 class="text-xl font-medium">Create New Storyboard Collection</h2>
  {#if formMessage}
    <div class="alert alert-success text-sm py-2 px-3">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="stroke-current shrink-0 h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        ><path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        /></svg
      >
      <span>{formMessage}</span>
    </div>
  {/if}
  {#if formError}
    <div class="alert alert-error text-sm py-2 px-3">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="stroke-current shrink-0 h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        ><path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        /></svg
      >
      <span>{formError}</span>
    </div>
  {/if}

  <div>
    <label for="collection-title" class="label">
      <span class="label-text">Collection Title</span>
    </label>
    <input
      type="text"
      id="collection-title"
      name="title"
      bind:value={title}
      class="input input-bordered w-full"
      required
      autocomplete="off"
    />
  </div>
  <div>
    <label for="collection-description" class="label">
      <span class="label-text">Description (Optional)</span>
    </label>
    <textarea
      id="collection-description"
      name="description"
      bind:value={description}
      class="textarea textarea-bordered w-full"
      rows="3"
    ></textarea>
  </div>
  <div>
    <label for="asset-files" class="label">
      <span class="label-text">Storyboard Image(s)</span>
    </label>
    <input
      id="asset-files"
      type="file"
      name="storyboardFiles"
      multiple
      accept={acceptedFileTypes}
      onchange={handleFileChange}
      class="file-input file-input-bordered w-full"
      required={selectedFiles.length === 0}
      disabled={isSubmitting}
    />
    <div class="label">
      <span class="label-text-alt"
        >Upload one or more images for this collection.</span
      >
    </div>
    {#if selectedFiles.length}
      <ul class="text-xs mt-2 max-h-20 overflow-y-auto">
        {#each selectedFiles as file (file.name)}
          <li>
            {file.name} ({Math.round(file.size / 1024)} KB)
            {#if individualProgress[file.name] !== undefined && individualProgress[file.name] < 100}
              <progress
                class="progress progress-xs progress-info w-16 ml-2"
                value={individualProgress[file.name]}
                max="100"
              ></progress>
            {:else if individualProgress[file.name] === 100}
              <span class="text-success ml-2 text-xs">(Uploaded)</span>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  </div>

  {#if isSubmitting && selectedFiles.length > 0}
    <div class="space-y-1">
      <p class="text-sm text-center">Overall Upload Progress:</p>
      <progress
        class="progress progress-primary w-full"
        value={overallProgress}
        max="100"
      ></progress>
    </div>
  {/if}

  <div class="card-actions justify-end">
    <button
      type="submit"
      class="btn btn-primary"
      disabled={isSubmitting || selectedFiles.length === 0}
    >
      {#if isSubmitting}
        <span class="loading loading-spinner loading-xs"></span>
        {overallProgress > 0 && overallProgress < 100
          ? `Uploading (${overallProgress}%)`
          : "Processing..."}
      {:else}
        Create Collection & Upload Images
      {/if}
    </button>
  </div>
</form>
