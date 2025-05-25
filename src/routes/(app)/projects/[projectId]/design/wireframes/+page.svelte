<!-- src/routes/(app)/projects/[projectId]/design/wireframes/+page.svelte -->
<script lang="ts">
  import type { PageData, ActionData } from "./$types"
  import { enhance } from "$app/forms"
  import { invalidateAll } from "$app/navigation" // To refresh data after form submission
  import { PUBLIC_SUPABASE_URL } from "$env/static/public" // For constructing image URLs
  import AssetSetUploader from "$lib/components/AssetSetUploader.svelte"

  let { data, form }: { data: PageData; form: ActionData } = $props()

  let newSetTitle = $state("")
  let newSetDescription = $state("")
  let newSetPlatform = $state("")
  let formMessage = $state("")
  let formError = $state("")
  let platformTag = $state("") // Add state for platform tag

  // Editing state for sets
  let editingSetId = $state<string | null>(null)
  let editTitle = $state("")
  let editPlatform = $state("")
  let editDescription = $state("")

  let wireframeSets = $state(data.wireframeSets || [])

  function startEdit(set: {
    id: string
    title: string
    platform_tag: string | null
    description: string | null
    project_assets?: Array<{
      id: string
      file_name: string
      file_path: string
      file_type: string | null
      size_bytes: number | null
      url: string | null
    }>
  }) {
    editingSetId = set.id
    editTitle = set.title
    editPlatform = set.platform_tag || ""
    editDescription = set.description || ""
  }

  function cancelEdit() {
    editingSetId = null
    editTitle = ""
    editPlatform = ""
    editDescription = ""
  }

  function confirmDeleteSet(event: Event) {
    // Prevent default form submit if not confirmed
    if (
      !window.confirm(
        "Are you sure you want to delete this wireframe set? This will remove all associated images.",
      )
    ) {
      event.preventDefault()
    }
  }

  // Clear form and messages on successful submission
  $effect(() => {
    if (form?.success) {
      newSetTitle = ""
      newSetDescription = ""
      newSetPlatform = ""
      // FileUploader handles file input reset
      formMessage = form.message ?? "Success!"
      formError = ""
      invalidateAll() // Refresh the list of collections
      // FileUploader handles file input reset
      cancelEdit()
    } else if (form?.error) {
      formError = form.error
      formMessage = ""
      // Preserve form values if needed, or clear based on error type
      if (form && typeof form === "object") {
        if ("title" in form && typeof form.title === "string")
          newSetTitle = form.title
        if ("description" in form && typeof form.description === "string")
          newSetDescription = form.description
        if ("platform" in form && typeof form.platform === "string")
          newSetPlatform = form.platform
      }
    }
  })

  function getSupabaseStorageUrl(filePath: string): string {
    if (!filePath) return "" // Handle cases where filePath might be null/undefined
    return `${PUBLIC_SUPABASE_URL}/storage/v1/object/project-assets/${filePath}`
  }

  function handleUploadSuccess() {
    invalidateAll()
  }

  // Handle platform tag changes from AssetSetUploader
  function handlePlatformTagChange(event: CustomEvent) {
    platformTag = event.detail.value
  }
</script>

<div class="space-y-8">
  <h1 class="text-2xl font-semibold">Wireframe Sets</h1>

  <!-- Form to Create New Wireframe Set -->
  <AssetSetUploader
    actionUrl="?/createWireframeSet"
    bucketName="project-assets"
    acceptedFileTypes="image/*"
    onUploadSuccess={handleUploadSuccess}
    assetCategory="wireframe"
    designSubsectionTag={platformTag}
    titleLabel="Create New Wireframe Set"
    on:platformTagChange={handlePlatformTagChange}
  />

  <!-- Display Existing Wireframe Sets -->
  {#if data.wireframeSets && data.wireframeSets.length > 0}
    <div class="space-y-6 mt-10">
      <h2 class="text-xl font-medium border-t border-base-300 pt-6">
        Existing Sets
      </h2>
      {#each data.wireframeSets as set (set.id)}
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            {#if editingSetId === set.id}
              <form
                method="POST"
                action="?/updateWireframeSet"
                use:enhance
                class="space-y-2"
              >
                <input type="hidden" name="id" value={set.id} />
                <label class="label" for={`edit-title-${set.id}`}>
                  <span class="label-text">Title</span>
                </label>
                <input
                  id={`edit-title-${set.id}`}
                  type="text"
                  name="title"
                  class="input input-bordered w-full"
                  bind:value={editTitle}
                  required
                />
                <label class="label" for={`edit-description-${set.id}`}>
                  <span class="label-text">Description (Optional)</span>
                </label>
                <textarea
                  id={`edit-description-${set.id}`}
                  name="description"
                  class="textarea textarea-bordered w-full"
                  rows="3"
                  bind:value={editDescription}
                ></textarea>
                <div class="flex gap-2 mt-2">
                  <button type="submit" class="btn btn-primary btn-sm"
                    >Save</button
                  >
                  <button
                    type="button"
                    class="btn btn-ghost btn-sm"
                    onclick={() => cancelEdit()}>Cancel</button
                  >
                </div>
              </form>
            {:else}
              <h3 class="card-title">{set.title}</h3>
              {#if set.description}
                <p class="text-sm text-base-content/80 prose max-w-none">
                  {set.description}
                </p>
              {/if}
            {/if}
            {#if set.project_assets && set.project_assets.length > 0}
              <div
                class="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
              >
                {#each set.project_assets as asset (asset.id)}
                  <div class="aspect-w-1 aspect-h-1 relative group">
                    <!-- svelte-ignore a11y_missing_attribute -->
                    <img
                      src={asset.url}
                      alt={asset.file_name || "Wireframe image"}
                      class="object-cover rounded-md shadow-sm w-full h-full"
                      loading="lazy"
                    />
                    <form
                      method="POST"
                      action="?/deleteWireframeAsset"
                      use:enhance
                      class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      style="z-index:10"
                    >
                      <input type="hidden" name="assetId" value={asset.id} />
                      <input
                        type="hidden"
                        name="filePath"
                        value={asset.file_path}
                      />
                      <button
                        type="submit"
                        class="btn btn-xs btn-error btn-circle"
                        aria-label="Delete image"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </form>
                  </div>
                {/each}
              </div>
            {:else}
              <p class="text-sm italic text-base-content/60 mt-2">
                No images uploaded for this set yet.
              </p>
            {/if}
            <div class="card-actions justify-end mt-4">
              {#if editingSetId === set.id}
                <!-- No edit/delete buttons while editing -->
              {:else}
                <button
                  class="btn btn-xs btn-ghost"
                  onclick={() =>
                    startEdit({
                      id: set.id,
                      title: set.title,
                      platform_tag: set.platform_tag,
                      description: set.description,
                      project_assets: set.project_assets,
                    })}
                >
                  Edit
                </button>
                <form
                  method="POST"
                  action="?/deleteWireframeSet"
                  use:enhance
                  style="display:inline"
                >
                  <input type="hidden" name="id" value={set.id} />
                  <button
                    type="submit"
                    class="btn btn-xs btn-error btn-outline"
                    aria-label="Delete Collection"
                    onclick={confirmDeleteSet}
                  >
                    Delete Collection
                  </button>
                </form>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="mt-10 text-center p-6 bg-base-200 rounded-md">
      <p class="text-base-content/70">
        No wireframe sets created yet for this project.
      </p>
    </div>
  {/if}
</div>
