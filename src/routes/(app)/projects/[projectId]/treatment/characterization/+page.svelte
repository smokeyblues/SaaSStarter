<script lang="ts">
  import { enhance } from "$app/forms";
  import { invalidateAll } from "$app/navigation";
  import type { ActionData, PageData } from "../$types";
  import RichTextEditor from "$lib/components/RichTextEditor.svelte";
  let { data, form }: { data: PageData; form: ActionData } = $props();
  let treatment = $derived(data.treatment ?? { characterization_attitude: "" });
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
</script>

<section>
  <h2 class="text-2xl font-semibold mb-4 border-b pb-2">Characterization & Attitude</h2>
  <form method="POST" action="?/saveTreatmentText" use:enhance>
    <input type="hidden" name="field" value="characterization_attitude" />
    <label class="form-control w-full">
      <RichTextEditor
        name="content"
        placeholder="Describe specific characters, key personalities, or the overall style and attitude."
        value={treatment.characterization_attitude ?? ""}
      />
    </label>
    <button type="submit" class="btn btn-sm btn-primary mt-3">Save Characterization</button>
    {#if currentForm?.action === "saveTreatmentText" && currentForm?.field === "characterization_attitude"}
      {#if currentForm?.success}
        <p class="text-success text-sm mt-1 inline-block ml-2">{currentForm.message}</p>
      {/if}
      {#if currentForm?.error}
        <p class="text-error text-sm mt-1 inline-block ml-2">{currentForm.error}</p>
      {/if}
    {/if}
  </form>
</section>
