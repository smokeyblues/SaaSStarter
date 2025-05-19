<!-- src/lib/components/FileUploader.svelte -->
<script lang="ts">
  import { page } from "$app/stores"
  import { getContext } from "svelte"
  import type { SupabaseClient } from "@supabase/supabase-js"
  import type { Database } from "../../DatabaseDefinitions" // Adjust path if needed

  let {
    bucketName, // e.g., 'project-assets'
    acceptedFileTypes = "*/*", // Default to all types, can be overridden
    actionUrl = "?/recordAssetUpload", // Default action, can be overridden
    onUploadSuccess, // Callback after DB record action succeeds
    id, // Optional id to forward to the input for accessibility
    /**
     * The field name to use for the uploaded file in FormData.
     * Use 'storyboardFiles' for storyboards, 'file' for generic, etc.
     * Default: 'file'
     */
    fileFieldName = "file",
  }: {
    bucketName: string
    acceptedFileTypes?: string
    actionUrl?: string
    onUploadSuccess?: () => void
    id?: string // Optional: forwarded to <input> for a11y
    fileFieldName?: string
  } = $props()

  // Get Supabase client and user from context or page store
  const supabase: SupabaseClient<Database> = $page.data.supabase // Example
  const user = $derived($page.data.user)
  const projectId = $derived($page.params.projectId)

  let selectedFile: File | null = $state(null)
  let isUploading = $state(false)
  let uploadProgress = $state(0) // Still needs implementation if possible
  let errorMessage = $state<string | null>(null)
  let successMessage = $state<string | null>(null)
  let fileInput: HTMLInputElement // Reference to file input

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement
    if (target.files && target.files.length > 0) {
      selectedFile = target.files[0]
      errorMessage = null
      successMessage = null
      uploadProgress = 0
    } else {
      selectedFile = null
    }
  }

  async function handleUpload() {
    if (!selectedFile || !user || !projectId) {
      errorMessage = "No file selected or missing user/project info."
      return
    }

    isUploading = true
    errorMessage = null
    successMessage = null
    uploadProgress = 0 // Reset progress

    // Construct a unique file path starting with project ID, then user ID
    const fileExt = selectedFile.name.split(".").pop()
    const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
    // ** Using Project ID / User ID / Filename structure **
    const filePath = `${projectId}/${user.id}/${uniqueFileName}`

    try {
      // --- TODO: Add progress listener if Supabase client supports it easily ---
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) {
        throw uploadError
      }

      if (!uploadData?.path) {
        throw new Error("Upload completed but no file path returned.")
      }

      // If upload successful, call the server action to record metadata
      const formData = new FormData()
      formData.append("fileName", selectedFile.name)
      formData.append("filePath", uploadData.path) // Use path returned by storage
      formData.append("fileType", selectedFile.type)
      formData.append("fileSize", selectedFile.size.toString())
      // Optional: Add more context if needed by the action
      // formData.append('context', 'treatment_script');

      // Use the configured file field name (default: 'file')
      formData.append(fileFieldName, selectedFile)

      // *** Use the actionUrl prop here ***
      const response = await fetch(actionUrl, {
        method: "POST",
        body: formData,
      })

      const result = await response.json() // Assuming action returns JSON

      // Check if the action indicated failure (adjust based on your action's return structure)
      if (!response.ok || result.type === "failure" || result.error) {
        const dbError =
          result.error ||
          result.message ||
          "Failed to record upload in database."
        // Attempt to clean up storage if DB fails
        console.warn(
          `Database record failed for ${uploadData.path}, attempting storage cleanup...`,
          dbError,
        )
        try {
          await supabase.storage.from(bucketName).remove([uploadData.path])
        } catch (cleanupError) {
          console.error("Storage cleanup failed:", cleanupError)
        }
        throw new Error(
          `Database error: ${dbError} (Attempted to remove uploaded file)`,
        )
      }

      // Success!
      successMessage = `File "${selectedFile.name}" uploaded and recorded successfully.`
      selectedFile = null // Clear selection
      if (fileInput) fileInput.value = "" // Reset file input visually
      if (onUploadSuccess) {
        onUploadSuccess() // Notify parent
      }
    } catch (error: any) {
      console.error("Upload process failed:", error)
      errorMessage = error.message || "An unknown error occurred during upload."
    } finally {
      isUploading = false
      uploadProgress = 0 // Reset progress
    }
  }
</script>

<div
  class="p-4 border border-base-300 rounded-md space-y-3 bg-base-100 shadow-sm"
>
  {#if errorMessage}
    <div class="alert alert-error text-xs p-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="stroke-current shrink-0 h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        ><path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        /></svg
      >
      <span>{errorMessage}</span>
    </div>
  {/if}
  {#if successMessage}
    <div class="alert alert-success text-xs p-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="stroke-current shrink-0 h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        ><path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        /></svg
      >
      <span>{successMessage}</span>
    </div>
  {/if}

  <input
    bind:this={fileInput}
    type="file"
    class="file-input file-input-bordered file-input-sm w-full max-w-xs {errorMessage
      ? 'file-input-error'
      : ''}"
    accept={acceptedFileTypes}
    id={id}
    onchange={handleFileSelect}
    disabled={isUploading}
  />

  {#if selectedFile}
    <div class="text-xs mt-1 text-base-content/80">
      Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
    </div>
  {/if}

  {#if isUploading}
    <progress
      class="progress progress-primary w-full h-1"
      value={uploadProgress}
      max="100"
    ></progress>
    <!-- <p class="text-xs text-center">Uploading...</p> -->
  {/if}

  <button
    class="btn btn-sm btn-secondary mt-2"
    onclick={handleUpload}
    disabled={!selectedFile || isUploading}
  >
    {#if isUploading}
      <span class="loading loading-spinner loading-xs"></span>
      Uploading...
    {:else}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        class="w-4 h-4 mr-1.5 opacity-80"
      >
        <path
          fill-rule="evenodd"
          d="M4.5 2A2.5 2.5 0 0 0 2 4.5v7A2.5 2.5 0 0 0 4.5 14h7a2.5 2.5 0 0 0 2.5-2.5v-7A2.5 2.5 0 0 0 11.5 2h-7ZM8.75 6.25a.75.75 0 0 0-1.5 0V8.5h-2.25a.75.75 0 0 0 0 1.5h2.25v2.25a.75.75 0 0 0 1.5 0V10h2.25a.75.75 0 0 0 0-1.5H8.75V6.25Z"
          clip-rule="evenodd"
        />
      </svg>
      Upload Selected File
    {/if}
  </button>
</div>
