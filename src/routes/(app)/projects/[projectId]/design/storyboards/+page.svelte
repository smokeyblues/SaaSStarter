<!-- src/routes/(app)/projects/[projectId]/design/storyboards/+page.svelte -->
<script lang="ts">
  import type { PageData, ActionData } from "./$types"
  import { enhance } from "$app/forms"
  import { invalidateAll } from "$app/navigation" // To refresh data after form submission
  import { PUBLIC_SUPABASE_URL } from "$env/static/public" // For constructing image URLs
  import AssetSetUploader from "$lib/components/AssetSetUploader.svelte"

  let { data, form }: { data: PageData; form: ActionData } = $props()

  let newCollectionTitle = $state("")
  let newCollectionDescription = $state("")
  let formMessage = $state("")
  let formError = $state("")

  // Editing state for collections
  let editingCollectionId = $state<string | null>(null)
  let editTitle = $state("")
  let editDescription = $state("")

  let storyboardCollections = $state(data.storyboardCollections || [])

  function startEdit(collection: {
    id: string
    title: string
    description?: string
  }) {
    editingCollectionId = collection.id
    editTitle = collection.title
    editDescription = collection.description || ""
  }

  function cancelEdit() {
    editingCollectionId = null
    editTitle = ""
    editDescription = ""
  }

  function confirmDeleteCollection(event: Event) {
    // Prevent default form submit if not confirmed
    if (
      !window.confirm(
        "Are you sure you want to delete this storyboard collection? This will remove all associated images.",
      )
    ) {
      event.preventDefault()
    }
  }

  // Clear form and messages on successful submission
  $effect(() => {
    if (form?.success) {
      newCollectionTitle = ""
      newCollectionDescription = ""
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
          newCollectionTitle = form.title
        if ("description" in form && typeof form.description === "string")
          newCollectionDescription = form.description
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
</script>

<div class="space-y-8">
  <h1 class="text-2xl font-semibold">Storyboard Collections</h1>

  <!-- Form to Create New Storyboard Collection -->
  <AssetSetUploader
    actionUrl="?/createStoryboardCollection"
    bucketName="project-assets"
    acceptedFileTypes="image/*"
    onUploadSuccess={handleUploadSuccess}
    assetCategory="storyboard"
    titleLabel="Create New Storyboard Collection"
  />

  <!-- Display Existing Storyboard Collections -->
  {#if data.storyboardCollections && data.storyboardCollections.length > 0}
    <div class="space-y-6 mt-10">
      <h2 class="text-xl font-medium border-t border-base-300 pt-6">
        Existing Collections
      </h2>
      {#each data.storyboardCollections as collection (collection.id)}
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            {#if editingCollectionId === collection.id}
              <form
                method="POST"
                action="?/updateStoryboardCollection"
                use:enhance
                class="space-y-2"
              >
                <input type="hidden" name="id" value={collection.id} />
                <label class="label" for={`edit-title-${collection.id}`}>
                  <span class="label-text">Title</span>
                </label>
                <input
                  id={`edit-title-${collection.id}`}
                  type="text"
                  name="title"
                  class="input input-bordered w-full"
                  bind:value={editTitle}
                  required
                />
                <label class="label" for={`edit-description-${collection.id}`}>
                  <span class="label-text">Description (Optional)</span>
                </label>
                <textarea
                  id={`edit-description-${collection.id}`}
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
              <h3 class="card-title">{collection.title}</h3>
              {#if collection.description}
                <p class="text-sm text-base-content/80 prose max-w-none">
                  {collection.description}
                </p>
              {/if}
            {/if}
            {#if collection.project_assets && collection.project_assets.length > 0}
              <div
                class="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
              >
                {#each collection.project_assets as asset (asset.id)}
                  <div class="aspect-w-1 aspect-h-1 relative group">
                    <!-- svelte-ignore a11y_missing_attribute -->
                    <img
                      src={asset.url}
                      alt={asset.file_name || "Storyboard image"}
                      class="object-cover rounded-md shadow-sm w-full h-full"
                      loading="lazy"
                    />
                    <form
                      method="POST"
                      action="?/deleteStoryboardAsset"
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
                No images uploaded for this collection yet.
              </p>
            {/if}
            <div class="card-actions justify-end mt-4">
              {#if editingCollectionId === collection.id}
                <!-- No edit/delete buttons while editing -->
              {:else}
                <button
                  class="btn btn-xs btn-ghost"
                  onclick={() =>
                    startEdit({
                      ...collection,
                      description: collection.description ?? "",
                    })}
                >
                  Edit
                </button>
                <form
                  method="POST"
                  action="?/deleteStoryboardCollection"
                  use:enhance
                  style="display:inline"
                >
                  <input type="hidden" name="id" value={collection.id} />
                  <button
                    type="submit"
                    class="btn btn-xs btn-error btn-outline"
                    aria-label="Delete Collection"
                    onclick={confirmDeleteCollection}
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
        No storyboard collections created yet for this project.
      </p>
    </div>
  {/if}
</div>
