<!-- src/routes/(app)/projects/[projectId]/+page.svelte -->
<script lang="ts">
  import { enhance } from "$app/forms"
  import type { ActionData, PageData } from "./$types" // Will get types from load function later
  import { page } from "$app/stores" // To access route params easily if needed, though data prop is better

  let { data, form }: { data: PageData; form: ActionData } = $props()

  // State for editing project name
  let editingName = $state(false)
  let projectNameInput = $state(data.project?.name ?? "")

  $effect(() => {
    // Update input only if not editing
    if (!editingName) {
      projectNameInput = data.project?.name ?? ""
    }
  })

  // Define the bible sections for iteration
  const bibleSections = [
    {
      name: "Treatment",
      slug: "treatment",
      description: "Story world, synopsis, characters...",
    },
    {
      name: "Functional Spec",
      slug: "functional",
      description: "User experience, platforms, rules...",
    },
    {
      name: "Design Spec",
      slug: "design",
      description: "Look & feel, branding, assets...",
    },
    {
      name: "Tech Spec",
      slug: "technology",
      description: "Infrastructure, architecture, build...",
    },
    {
      name: "Business & Marketing",
      slug: "business",
      description: "Goals, audience, budget, team...",
    },
  ]

  function deleteProject() {
    if (
      confirm(
        `Are you sure you want to delete project "${data.project?.name || "this project"}"? This cannot be undone.`,
      )
    ) {
      alert("Placeholder: Delete Project action")
      // TODO: Implement form submission or API call for deletion
    }
  }
</script>

<div class="p-4 md:p-8 max-w-7xl mx-auto">
  <!-- Header Section -->
  <div
    class="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
  >
    <div>
      <!-- Optional Breadcrumbs -->
      <div class="text-sm breadcrumbs mb-1">
        <ul>
          <li><a href="/dashboard">Dashboard</a></li>
          {#if data.team}
            <li><a href="/teams/{data.team.id}">{data.team.name}</a></li>
          {/if}
          <li>{data.project?.name || "Project"}</li>
        </ul>
      </div>
      {#if !editingName}
        <h1 class="text-3xl md:text-4xl font-bold">
          {data.project?.name || "Loading Project..."}
        </h1>
      {:else}
        <form method="POST" action="?/updateProjectName" class="flex-grow mr-4">
          <input
            type="text"
            name="projectName"
            bind:value={projectNameInput}
            class="input input-bordered w-full max-w-xs"
            required
          />
          <button type="submit" class="btn btn-primary ml-2">Save</button>
          <button
            type="button"
            onclick={() => (editingName = false)}
            class="btn btn-ghost ml-1">Cancel</button
          >
          {#if form?.action === "updateName" && form?.error && "currentName" in form && form.currentName !== undefined}
            <p class="text-error text-sm mt-1">
              {form.error} (You entered: {form.currentName})
            </p>
          {/if}
        </form>
      {/if}
    </div>

    <!-- Project Actions Dropdown -->
    <div class="dropdown dropdown-end">
      <button class="btn btn-ghost btn-sm m-1">
        <span>Project Actions</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-4 h-4 ml-1"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="m19.5 8.25-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button>
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <ul
        tabindex="0"
        class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
      >
        <li><button onclick={() => (editingName = true)}>Edit Name</button></li>
        <li>
          <button onclick={deleteProject} class="text-error"
            >Delete Project</button
          >
        </li>
        <!-- Add other actions like 'Manage Access' later -->
      </ul>
    </div>
  </div>

  <!-- Show general errors for this action if currentName is NOT set -->
  {#if form?.action === "updateName" && form?.error && (!("currentName" in form) || form.currentName === undefined)}
    <p class="text-error text-sm">{form.error}</p>
  {/if}

  <!-- Bible Sections Overview -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each bibleSections as section}
      <div
        class="card bg-base-100 shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out"
      >
        <div class="card-body">
          <h2 class="card-title">{section.name}</h2>
          <p class="text-sm text-neutral-600 flex-grow">
            {section.description}
          </p>
          <!-- TODO: Add status indicator later (e.g., Not Started, Complete) -->
          <div class="card-actions justify-end mt-4">
            <!-- Link to the specific section route (will be created later) -->
            <a
              href="/projects/{data.project?.id}/{section.slug}"
              class="btn btn-primary btn-sm"
            >
              View / Edit
            </a>
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  /* Optional: Add custom styles if needed */
</style>
