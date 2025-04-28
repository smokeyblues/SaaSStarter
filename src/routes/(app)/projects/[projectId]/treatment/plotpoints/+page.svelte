<script lang="ts">
  import { enhance } from "$app/forms";
  import { invalidateAll } from "$app/navigation";
  import type { ActionData, PageData } from "../$types";
  import EditableListItem from "$lib/components/EditableListItem.svelte";
  let { data, form }: { data: PageData; form: ActionData } = $props();
  let plotPoints = $derived(data.plotPoints ?? []);
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
  <h2 class="text-2xl font-semibold mb-4 border-b pb-2">Plot Points</h2>
  <p class="text-sm mb-4">List key story-centric elements or events in sequence.</p>
  <div class="space-y-3 mb-6">
    {#each plotPoints as point (point.id)}
      <EditableListItem
        item={point}
        updateAction="?/updatePlotPoint"
        deleteAction="?/deletePlotPoint"
      />
    {/each}
  </div>
  <form method="POST" action="?/addPlotPoint" use:enhance class="flex items-start gap-2">
    <textarea
      name="description"
      class="textarea textarea-bordered w-full max-w-lg"
      placeholder="New plot point description..."
      required
      rows="2"
    ></textarea>
    <button type="submit" class="btn btn-secondary">Add Point</button>
  </form>
  {#if currentForm?.action === "addPlotPoint" || currentForm?.action === "deletePlotPoint"}
    {#if currentForm?.success}
      <p class="text-success text-sm mt-1">{currentForm.message}</p>
    {/if}
    {#if currentForm?.error}
      <p class="text-error text-sm mt-1">{currentForm.error}</p>
    {/if}
  {/if}
</section>
