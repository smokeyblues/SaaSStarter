<script lang="ts">
  import { enhance } from "$app/forms"
  import type { ActionData, PageData } from "./$types"
  import { page } from "$app/stores"

  interface SectionStatus {
    treatment?: {
      hasSynopsis?: boolean
      hasCharacters?: boolean
    }
    business?: {
      hasAudience?: boolean
      hasGoals?: boolean
    }
    design?: {
      isStarted?: boolean
    }
    functional?: {
      isStarted?: boolean
    }
    technology?: {
      isStarted?: boolean
    }
  }

  interface ExtendedPageData extends PageData {
    sectionStatus?: SectionStatus
  }

  let { data, form }: { data: ExtendedPageData; form: ActionData } = $props()

  // State for editing project name
  let editingName = $state(false)
  let projectNameInput = $state(data.project?.name ?? "")

  $effect(() => {
    if (!editingName) {
      projectNameInput = data.project?.name ?? ""
    }
  })

  // Define the bible sections with reactive status
  const bibleSections = [
    {
      name: "Treatment",
      slug: "treatment",
      description: "Story world, synopsis, characters...",
      isActive: true, // Always active
      isComplete:
        data.sectionStatus?.treatment?.hasSynopsis &&
        data.sectionStatus?.treatment?.hasCharacters,
    },
    {
      name: "Business & Marketing",
      slug: "business",
      description: "Goals, audience, budget, team...",
      isActive:
        data.sectionStatus?.treatment?.hasSynopsis &&
        data.sectionStatus?.treatment?.hasCharacters,
      isComplete:
        data.sectionStatus?.business?.hasAudience &&
        data.sectionStatus?.business?.hasGoals,
    },
    {
      name: "Design Spec",
      slug: "design",
      description: "Look & feel, branding, assets...",
      isActive:
        data.sectionStatus?.business?.hasAudience &&
        data.sectionStatus?.business?.hasGoals,
    },
    {
      name: "Functional Spec",
      slug: "functional",
      description: "User experience, platforms, rules...",
      isActive:
        data.sectionStatus?.business?.hasAudience &&
        data.sectionStatus?.business?.hasGoals,
    },
    {
      name: "Tech Spec",
      slug: "technology",
      description: "Infrastructure, architecture, build...",
      isActive: data.sectionStatus?.functional?.isStarted,
    },
  ]

  function confirmDelete(event: SubmitEvent) {
    const projectName = data.project?.name || "this project"
    if (
      !window.confirm(
        `Are you sure you want to permanently delete project "${projectName}"? This action cannot be undone.`,
      )
    ) {
      event.preventDefault()
    }
  }
</script>

<div class="p-4 md:p-8 max-w-7xl mx-auto">
  <!-- Header Section -->
  <div
    class="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
  >
    <div>
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
          <form method="POST" action="?/deleteProject" onsubmit={confirmDelete}>
            <button type="submit" class="w-full text-left text-error"
              >Delete Project</button
            >
          </form>
        </li>
      </ul>
    </div>
  </div>

  <!-- General Delete Project Error -->
  {#if form?.action === "deleteProject" && form?.error}
    <p class="text-error text-sm">{form.error}</p>
  {/if}

  <!-- Show general errors for updateName action if currentName is NOT set -->
  {#if form?.action === "updateName" && form?.error && (!("currentName" in form) || form.currentName === undefined)}
    <p class="text-error text-sm">{form.error}</p>
  {/if}

  <!-- Bible Sections Overview -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each bibleSections as section}
      <div
        class="card bg-base-100 shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out {section.isActive
          ? ''
          : 'opacity-50 pointer-events-none'}"
      >
        <div class="card-body">
          <h2 class="card-title">
            {section.name}
            {#if section.isActive && !section.isComplete}
              <span class="badge badge-primary ml-2">Start Here</span>
            {/if}
            {#if section.isComplete}
              <span class="badge badge-success ml-2">Complete</span>
            {/if}
          </h2>
          <p class="text-sm text-neutral-600 flex-grow">
            {section.description}
          </p>
          <div class="card-actions justify-end mt-4">
            <a
              href="/projects/{data.project?.id}/{section.slug}"
              class="btn btn-primary btn-sm {section.isActive
                ? ''
                : 'btn-disabled'}"
            >
              View / Edit
            </a>
          </div>
        </div>
      </div>
    {/each}
  </div>

  <!-- Market Testing Prompt -->
  {#if data.sectionStatus?.business?.hasAudience && data.sectionStatus?.business?.hasGoals}
    <div class="alert alert-info mt-6">
      <div>
        <span>
          Consider testing your core concept! Exploring initial Design
          Aesthetics and Functional User Journeys can help create effective test
          materials.
        </span>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Optional: Add custom styles if needed */
</style>
