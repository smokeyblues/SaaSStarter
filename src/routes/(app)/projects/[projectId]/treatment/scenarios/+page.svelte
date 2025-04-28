<script lang="ts">
  import { enhance } from "$app/forms";
  import { invalidateAll } from "$app/navigation";
  import type { ActionData, PageData } from "../$types";
  import EditableListItem from "$lib/components/EditableListItem.svelte";
  let { data, form }: { data: PageData; form: ActionData } = $props();
  let userScenarios = $derived(data.userScenarios ?? []);
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
  <h2 class="text-2xl font-semibold mb-4 border-b pb-2">User-Centric Scenarios</h2>
  <p class="text-sm mb-4">Describe typical user routes or experiences through the project.</p>
  <div class="space-y-3 mb-6">
    {#each userScenarios as scenario (scenario.id)}
      <EditableListItem
        item={scenario}
        updateAction="?/updateUserScenario"
        deleteAction="?/deleteUserScenario"
      />
    {/each}
  </div>
  <form method="POST" action="?/addUserScenario" use:enhance class="flex items-start gap-2">
    <textarea
      name="description"
      class="textarea textarea-bordered w-full max-w-lg"
      placeholder="New user scenario description..."
      required
      rows="3"
    ></textarea>
    <button type="submit" class="btn btn-secondary">Add Scenario</button>
  </form>
  {#if currentForm?.action === "addUserScenario" || currentForm?.action === "deleteUserScenario"}
    {#if currentForm?.success}
      <p class="text-success text-sm mt-1">{currentForm.message}</p>
    {/if}
    {#if currentForm?.error}
      <p class="text-error text-sm mt-1">{currentForm.error}</p>
    {/if}
  {/if}
</section>
