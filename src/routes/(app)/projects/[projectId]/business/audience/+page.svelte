<script lang="ts">
  import { enhance } from "$app/forms"
  import { invalidateAll } from "$app/navigation"
  import type { ActionData, PageData } from "../$types"
  import RichTextEditor from "$lib/components/RichTextEditor.svelte"
  let { data, form }: { data: PageData; form: ActionData } = $props()

  // Reactive state for handling form feedback
  let currentForm = $state<ActionData>(null)
  $effect(() => {
    currentForm = form // Update based on form submission result
    if (form?.success) {
      // Optional: Invalidate data to refresh if needed, though not always necessary if just displaying feedback
      invalidateAll()

      // Clear the success message after a few seconds
      const timer = setTimeout(() => {
        currentForm = null
      }, 3000)
      return () => clearTimeout(timer)
    }
  })
  let businessGoals = $derived(data.businessDetails ?? { target_audience: "" })
</script>

<section>
  <h2 class="text-2xl font-semibold mb-4 border-b pb-2">Audience</h2>
  <p class="text-base-content/80 mb-4">
    Who is the target audience for this project?
  </p>

  <form method="POST" action="?/saveAudience" use:enhance>
    <!-- Hidden input to specify which field is being saved -->
    <input type="hidden" name="field" value="target_audience" />

    <!-- The Rich Text Editor component -->
    <!-- This name corresponds to the key expected by the action -->
    <!-- Bind the editor's content -->
    <RichTextEditor
      name="content"
      placeholder="Describe the target audience."
      value={businessGoals.target_audience ?? ""}
    />

    <div class="mt-4 flex items-center gap-4">
      <button type="submit" class="btn btn-primary">Save Audience</button>
      {#if currentForm?.action === "saveAudience" && currentForm?.field === "target_audience"}
        {#if currentForm?.success}
          <p class="text-success text-sm">{currentForm.message}</p>
        {/if}
        {#if currentForm?.error}
          <p class="text-error text-sm">{currentForm.error}</p>
        {/if}
      {/if}
    </div>
  </form>
</section>
