<script lang="ts">
  import { enhance } from "$app/forms";
  import { invalidateAll } from "$app/navigation";
  import type { ActionData, PageData } from "../$types";
  import RichTextEditor from "$lib/components/RichTextEditor.svelte";
  let { data, form }: { data: PageData; form: ActionData } = $props();

  let currentForm = $state<ActionData>(null);
  $effect(() => {
    currentForm = form;
    if (form?.success) {
      invalidateAll();
      const timer = setTimeout(() => {
        currentForm = null;
      }, 3000);
      return () => clearTimeout(timer);
    }
  });
  let treatment = $derived(data.treatment ?? { backstory_context: "" });
</script>

<section>
  <h2 class="text-2xl font-semibold mb-4 border-b pb-2">Back Story & Context</h2>
  <form method="POST" action="?/saveTreatmentText" use:enhance>
    <input type="hidden" name="field" value="backstory_context" />
    <label class="form-control w-full">
      <RichTextEditor
        name="content"
        placeholder="Describe the world, history, mythology, or context."
        value={treatment.backstory_context ?? ""}
      />
    </label>
    <button type="submit" class="btn btn-sm btn-primary mt-3">Save Back Story</button>
    {#if currentForm?.action === "saveTreatmentText" && currentForm?.field === "backstory_context"}
      {#if currentForm?.success}
        <p class="text-success text-sm mt-1 inline-block ml-2">{currentForm.message}</p>
      {/if}
      {#if currentForm?.error}
        <p class="text-error text-sm mt-1 inline-block ml-2">{currentForm.error}</p>
      {/if}
    {/if}
  </form>
</section>
