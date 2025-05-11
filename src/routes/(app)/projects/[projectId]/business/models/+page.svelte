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
  let businessGoals = $derived(data.businessDetails ?? { business_models: "" })
</script>

<section>
  <h2 class="text-2xl font-semibold mb-4 border-b pb-2">Business Models</h2>
  <p class="text-base-content/80 mb-4">
    Provide an overview of how the budget will be raised or revenue generated.
  </p>

  <form method="POST" action="?/saveBusinessModels" use:enhance>
    <!-- Hidden input to specify which field is being saved -->
    <input type="hidden" name="field" value="business_models" />

    <!-- The Rich Text Editor component -->
    <!-- This name corresponds to the key expected by the action -->
    <!-- Bind the editor's content -->
    <RichTextEditor
      name="content"
      placeholder="Describe the business models for this project. For many multi-platform services there will be a mix of business models, so this section will detail primary and secondary models."
      value={businessGoals.business_models ?? ""}
    />

    <div class="mt-4 flex items-center gap-4">
      <button type="submit" class="btn btn-primary">Save Business Models</button
      >
      {#if currentForm?.action === "saveBusinessModels" && currentForm?.field === "business_models"}
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
