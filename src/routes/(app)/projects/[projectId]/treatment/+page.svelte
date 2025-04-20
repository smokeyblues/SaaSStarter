<!-- src/routes/(app)/projects/[projectId]/treatment/+page.svelte -->
<script lang="ts">
  import { enhance } from "$app/forms"
  import { page } from "$app/stores"
  import type { ActionData, PageData } from "./$types"
  import { invalidateAll } from "$app/navigation"

  import RichTextEditor from "$lib/components/RichTextEditor.svelte"
  import FileUploader from "$lib/components/FileUploader.svelte"
  import EditableListItem from "$lib/components/EditableListItem.svelte"

  let { data, form }: { data: PageData; form: ActionData } = $props()

  // State for sub-navigation styling or scroll management
  let activeSubSectionId = $state("")

  // Reactive updates for form feedback
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

  function handleSubNavClick(sectionId: string) {
    const element = document.getElementById(sectionId)
    element?.scrollIntoView({ behavior: "smooth", block: "start" })
    activeSubSectionId = sectionId
  }

  // === UPDATED DERIVED STATE for treatment ===
  // Define the fallback with all potentially accessed fields
  const defaultTreatmentShape = {
    project_id: $page.params.projectId,
    tagline: null,
    backstory_context: null,
    synopsis: null,
    characterization_attitude: null,
    // Include other fields even if not directly used in THIS page's template, for type consistency
    id: undefined, // Or null, depending on how you handle non-existent records
    created_at: null,
    updated_at: null,
  }
  let treatment = $derived(data.treatment ?? defaultTreatmentShape)
  // ===========================================

  let plotPoints = $derived(data.plotPoints ?? [])
  let userScenarios = $derived(data.userScenarios ?? [])
  let scripts = $derived(data.scripts ?? [])
</script>

<div class="flex flex-col md:flex-row gap-8">
  <!-- Sub-navigation Sidebar -->
  <aside class="w-full md:w-1/4 lg:w-1/5 md:sticky md:top-24 self-start">
    <ul class="menu bg-base-200 rounded-box p-2">
      <li>
        <button
          class={activeSubSectionId === "tagline" ? "active" : ""}
          onclick={() => handleSubNavClick("tagline")}>Tagline</button
        >
      </li>
      <li>
        <button
          class={activeSubSectionId === "backstory" ? "active" : ""}
          onclick={() => handleSubNavClick("backstory")}
          >Back Story & Context</button
        >
      </li>
      <li>
        <button
          class={activeSubSectionId === "synopsis" ? "active" : ""}
          onclick={() => handleSubNavClick("synopsis")}>Synopsis</button
        >
      </li>
      <li>
        <button
          class={activeSubSectionId === "plotpoints" ? "active" : ""}
          onclick={() => handleSubNavClick("plotpoints")}>Plot Points</button
        >
      </li>
      <li>
        <button
          class={activeSubSectionId === "characterization" ? "active" : ""}
          onclick={() => handleSubNavClick("characterization")}
          >Characterization & Attitude</button
        >
      </li>
      <li>
        <button
          class={activeSubSectionId === "scripts" ? "active" : ""}
          onclick={() => handleSubNavClick("scripts")}>Scripts</button
        >
      </li>
      <li>
        <button
          class={activeSubSectionId === "scenarios" ? "active" : ""}
          onclick={() => handleSubNavClick("scenarios")}>User Scenarios</button
        >
      </li>
    </ul>
  </aside>

  <!-- Main Content Area -->
  <main class="w-full md:w-3/4 lg:w-4/5 space-y-12">
    <!-- Tagline Section -->
    <section id="tagline" class="scroll-mt-20">
      <h2 class="text-2xl font-semibold mb-4 border-b pb-2">Tagline</h2>
      <form method="POST" action="?/saveTreatmentText" use:enhance>
        <input type="hidden" name="field" value="tagline" />
        <label class="form-control w-full">
          <input
            type="text"
            name="content"
            class="input input-bordered w-full"
            placeholder="Enter the project tagline"
            value={treatment.tagline ?? ""}
          />
        </label>
        <button type="submit" class="btn btn-sm btn-primary mt-3"
          >Save Tagline</button
        >
        {#if currentForm?.action === "saveTreatmentText" && currentForm?.field === "tagline"}
          {#if currentForm?.success}
            <p class="text-success text-sm mt-1 inline-block ml-2">
              {currentForm.message}
            </p>
          {/if}
          {#if currentForm?.error}
            <p class="text-error text-sm mt-1 inline-block ml-2">
              {currentForm.error}
            </p>
          {/if}
        {/if}
      </form>
    </section>

    <!-- Back Story Section -->
    <section id="backstory" class="scroll-mt-20">
      <h2 class="text-2xl font-semibold mb-4 border-b pb-2">
        Back Story & Context
      </h2>
      <form method="POST" action="?/saveTreatmentText" use:enhance>
        <input type="hidden" name="field" value="backstory_context" />
        <label class="form-control w-full">
          <RichTextEditor
            name="content"
            placeholder="Describe the world, history, mythology, or context."
            value={treatment.backstory_context ?? ""}
          />
        </label>
        <button type="submit" class="btn btn-sm btn-primary mt-3"
          >Save Back Story</button
        >
        {#if currentForm?.action === "saveTreatmentText" && currentForm?.field === "backstory_context"}
          {#if currentForm?.success}
            <p class="text-success text-sm mt-1 inline-block ml-2">
              {currentForm.message}
            </p>
          {/if}
          {#if currentForm?.error}
            <p class="text-error text-sm mt-1 inline-block ml-2">
              {currentForm.error}
            </p>
          {/if}
        {/if}
      </form>
    </section>

    <!-- Synopsis Section -->
    <section id="synopsis" class="scroll-mt-20">
      <h2 class="text-2xl font-semibold mb-4 border-b pb-2">Synopsis</h2>
      <form method="POST" action="?/saveTreatmentText" use:enhance>
        <input type="hidden" name="field" value="synopsis" />
        <label class="form-control w-full">
          <RichTextEditor
            name="content"
            placeholder="Outline the actual project or service being produced."
            value={treatment.synopsis ?? ""}
          />
        </label>
        <button type="submit" class="btn btn-sm btn-primary mt-3"
          >Save Synopsis</button
        >
        {#if currentForm?.action === "saveTreatmentText" && currentForm?.field === "synopsis"}
          {#if currentForm?.success}
            <p class="text-success text-sm mt-1 inline-block ml-2">
              {currentForm.message}
            </p>
          {/if}
          {#if currentForm?.error}
            <p class="text-error text-sm mt-1 inline-block ml-2">
              {currentForm.error}
            </p>
          {/if}
        {/if}
      </form>
    </section>

    <!-- Plot Points Section -->
    <section id="plotpoints" class="scroll-mt-20">
      <h2 class="text-2xl font-semibold mb-4 border-b pb-2">Plot Points</h2>
      <p class="text-sm mb-4">
        List key story-centric elements or events in sequence.
      </p>
      <div class="space-y-3 mb-6">
        {#each plotPoints as point (point.id)}
          <EditableListItem
            item={point}
            updateAction="?/updatePlotPoint"
            deleteAction="?/deletePlotPoint"
          />
        {/each}
      </div>
      <form
        method="POST"
        action="?/addPlotPoint"
        use:enhance
        class="flex items-start gap-2"
      >
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

    <!-- Characterization Section -->
    <section id="characterization" class="scroll-mt-20">
      <h2 class="text-2xl font-semibold mb-4 border-b pb-2">
        Characterization & Attitude
      </h2>
      <form method="POST" action="?/saveTreatmentText" use:enhance>
        <input type="hidden" name="field" value="characterization_attitude" />
        <label class="form-control w-full">
          <RichTextEditor
            name="content"
            placeholder="Describe specific characters, key personalities, or the overall style and attitude."
            value={treatment.characterization_attitude ?? ""}
          />
        </label>
        <button type="submit" class="btn btn-sm btn-primary mt-3"
          >Save Characterization</button
        >
        {#if currentForm?.action === "saveTreatmentText" && currentForm?.field === "characterization_attitude"}
          {#if currentForm?.success}
            <p class="text-success text-sm mt-1 inline-block ml-2">
              {currentForm.message}
            </p>
          {/if}
          {#if currentForm?.error}
            <p class="text-error text-sm mt-1 inline-block ml-2">
              {currentForm.error}
            </p>
          {/if}
        {/if}
      </form>
    </section>

    <!-- Scripts Section -->
    <section id="scripts" class="scroll-mt-20">
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
            <form
              method="POST"
              action="?/deleteScript"
              use:enhance
              class="inline"
            >
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
        bucketName={"project-assets"}
        onUploadSuccess={() => invalidateAll()}
      />
    </section>

    <!-- User Scenarios Section -->
    <section id="scenarios" class="scroll-mt-20">
      <h2 class="text-2xl font-semibold mb-4 border-b pb-2">
        User-Centric Scenarios
      </h2>
      <p class="text-sm mb-4">
        Describe typical user routes or experiences through the project.
      </p>
      <div class="space-y-3 mb-6">
        {#each userScenarios as scenario (scenario.id)}
          <EditableListItem
            item={scenario}
            updateAction="?/updateUserScenario"
            deleteAction="?/deleteUserScenario"
          />
        {/each}
      </div>
      <form
        method="POST"
        action="?/addUserScenario"
        use:enhance
        class="flex items-start gap-2"
      >
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
  </main>
</div>

<style>
  /* Add scroll-margin-top to prevent headers being hidden by sticky nav */
  section[id] {
    scroll-margin-top: 6rem; /* Adjust based on actual header/nav height */
  }
</style>
