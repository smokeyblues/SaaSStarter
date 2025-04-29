<script lang="ts">
  import { invalidateAll } from "$app/navigation"
  import { enhance } from "$app/forms"
  import FileUploader from "$lib/components/FileUploader.svelte"
  import type { ActionData, PageData } from "../$types"
  let { data, form }: { data: PageData; form: ActionData } = $props()
  let scripts = $derived(data.scripts ?? [])
  let currentForm = $state<ActionData>(null)
  $effect(() => {
    currentForm = form
    if (form?.success) {
      invalidateAll()
      const timer = setTimeout(() => {
        currentForm = null
      }, 3000)
      return () => clearTimeout(timer)
    }
  })
</script>

<section>
  <h2 class="text-2xl font-semibold mb-4 border-b pb-2">Scripts</h2>
  <p class="text-sm mb-4">Upload script files (e.g., PDF, Fountain).</p>
  <div class="space-y-3 mb-6">
    {#each scripts as script (script.id)}
      <div
        class="p-3 bg-base-100 rounded shadow-sm flex justify-between items-center"
      >
        {#if script.url}
          <a
            href={script.url}
            target="_blank"
            rel="noopener noreferrer"
            class="link link-hover flex items-center gap-2"
          >
            <!-- Basic File Icon Placeholder -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              class="w-4 h-4"
              ><path
                d="M2 3.5A1.5 1.5 0 0 1 3.5 2h6.89a1.5 1.5 0 0 1 1.06.44l2.11 2.11A1.5 1.5 0 0 1 14 5.61V12.5A1.5 1.5 0 0 1 12.5 14h-9A1.5 1.5 0 0 1 2 12.5v-9ZM10.5 3.5h-7a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5V6h-3.5A1.5 1.5 0 0 1 9 4.5V3Z"
              /></svg
            >
            {script.file_name}
          </a>
        {:else}
          <span class="flex items-center gap-2 text-base-content/70">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              class="w-4 h-4"
              ><path
                d="M2 3.5A1.5 1.5 0 0 1 3.5 2h6.89a1.5 1.5 0 0 1 1.06.44l2.11 2.11A1.5 1.5 0 0 1 14 5.61V12.5A1.5 1.5 0 0 1 12.5 14h-9A1.5 1.5 0 0 1 2 12.5v-9ZM10.5 3.5h-7a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5V6h-3.5A1.5 1.5 0 0 1 9 4.5V3Z"
              /></svg
            >
            {script.file_name} (Link unavailable)
          </span>
        {/if}
        <form method="POST" action="?/deleteScript" use:enhance class="inline">
          <input type="hidden" name="assetId" value={script.id} />
          <input type="hidden" name="filePath" value={script.file_path} />
          <button
            type="submit"
            class="btn btn-xs btn-ghost text-error"
            aria-label={`Delete script ${script.file_name}`}>Delete</button
          >
        </form>
      </div>
    {:else}
      <p class="text-base-content/70 italic">No scripts uploaded yet.</p>
    {/each}
  </div>
  <FileUploader
    bucketName="project-assets"
    acceptedFileTypes="application/pdf, .fountain, .fdx, text/plain"
    actionUrl="?/recordScriptUpload"
    onUploadSuccess={() => {
      console.log("Script uploaded!")
      invalidateAll() /* Or specific invalidate */
    }}
  />
</section>
