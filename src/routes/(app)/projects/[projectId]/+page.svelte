<!-- src/routes/(app)/projects/[projectId]/+page.svelte -->
<script lang="ts">
  import type { PageData } from "./$types" // Will get types from load function later
  import { page } from "$app/stores" // To access route params easily if needed, though data prop is better

  export let data: PageData

  // Assume data contains: { project: { id: string, name: string }, team: { id: string, name: string } }
  // This structure needs to be provided by the load function in +page.server.ts

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

  // Placeholder functions for actions (will be replaced by forms/modals later)
  function editProjectName() {
    alert("Placeholder: Edit Project Name action")
  }
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
      <h1 class="text-3xl md:text-4xl font-bold">
        {data.project?.name || "Loading Project..."}
      </h1>
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
        <li><button on:click={editProjectName}>Edit Name</button></li>
        <li>
          <button on:click={deleteProject} class="text-error"
            >Delete Project</button
          >
        </li>
        <!-- Add other actions like 'Manage Access' later -->
      </ul>
    </div>
  </div>

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
