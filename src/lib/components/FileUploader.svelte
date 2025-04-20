<!-- src/lib/components/FileUploader.svelte -->
<script lang="ts">
  import { page } from "$app/stores"
  import { getContext } from "svelte"
  import type { SupabaseClient } from "@supabase/supabase-js"
  import type { Database } from "../../DatabaseDefinitions" // Adjust path if needed

  let {
    bucketName, // e.g., 'project-assets'
    acceptedFileTypes = "application/pdf, .fountain, .fdx", // Default to script types
    onUploadSuccess, // Callback after DB record action succeeds
  }: {
    bucketName: string
    acceptedFileTypes?: string
    onUploadSuccess?: () => void
  } = $props()

  // Get Supabase client and user from context or page store
  // Adjust based on how you provide Supabase client (likely from root layout load)
  const supabase: SupabaseClient<Database> = $page.data.supabase // Example: Assuming it's loaded in root +layout.ts
  const user = $derived($page.data.user)
  const projectId = $derived($page.params.projectId)

  let selectedFile: File | null = $state(null)
  let isUploading = $state(false)
  let uploadProgress = $state(0)
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
    uploadProgress = 0

    // Construct a unique file path
    const fileExt = selectedFile.name.split(".").pop()
    const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
    // Consider a user/project specific folder structure
    const filePath = `${user.id}/${projectId}/${uniqueFileName}`

    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, selectedFile, {
          cacheControl: "3600", // Adjust as needed
          upsert: false, // Don't overwrite existing files with same name (should be unique anyway)
        })
      // --- TODO: Add progress listener if Supabase client supports it easily ---
      // Example structure (check docs for exact API):
      // const { data, error } = await supabase.storage.from(bucketName).upload(
      //      filePath, selectedFile, { upsert: false },
      //      (event) => { if (event.type === 'UPLOAD_PROGRESS') uploadProgress = event.payload.progress }
      // );

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

      const response = await fetch("?/recordScriptUpload", {
        // Target correct action
        method: "POST",
        body: formData,
      })

      const result = await response.json() // SvelteKit form actions return JSON

      if (!response.ok || result.type === "failure") {
        const dbError =
          result.data?.error || "Failed to record upload in database."
        // Attempt to clean up storage if DB fails
        console.warn(
          `Database record failed for ${uploadData.path}, attempting storage cleanup...`,
        )
        await supabase.storage.from(bucketName).remove([uploadData.path])
        throw new Error(`Database error: ${dbError} (Uploaded file removed)`)
      }

      // Success!
      successMessage = `File "${selectedFile.name}" uploaded and recorded successfully.`
      selectedFile = null // Clear selection
      if (fileInput) fileInput.value = "" // Reset file input visually
      if (onUploadSuccess) {
        onUploadSuccess() // Notify parent (e.g., to refresh script list via invalidateAll)
      }
    } catch (error: any) {
      console.error("Upload failed:", error)
      errorMessage = error.message || "An unknown error occurred during upload."
    } finally {
      isUploading = false
      uploadProgress = 0 // Reset progress
    }
  }
</script>

<div class="p-4 border border-base-300 rounded-md space-y-3">
  {#if errorMessage}
    <div class="alert alert-error text-xs p-2"><span>{errorMessage}</span></div>
  {/if}
  {#if successMessage}
    <div class="alert alert-success text-xs p-2">
      <span>{successMessage}</span>
    </div>
  {/if}

  <input
    bind:this={fileInput}
    type="file"
    class="file-input file-input-bordered file-input-sm w-full max-w-xs"
    accept={acceptedFileTypes}
    onchange={handleFileSelect}
    disabled={isUploading}
  />

  {#if selectedFile}
    <div class="text-sm mt-2">
      Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
    </div>
  {/if}

  {#if isUploading}
    <progress
      class="progress progress-primary w-full"
      value={uploadProgress}
      max="100"
    ></progress>
    <p class="text-xs text-center">Uploading...</p>
  {/if}

  <button
    class="btn btn-sm btn-secondary mt-2"
    onclick={handleUpload}
    disabled={!selectedFile || isUploading}
  >
    {#if isUploading}Uploading...{:else}Upload Selected File{/if}
  </button>
</div>
