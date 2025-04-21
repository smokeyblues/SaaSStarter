<!-- src/routes/(app)/projects/[projectId]/+layout.svelte -->
<script lang="ts">
  import { enhance } from "$app/forms"
  import { page } from "$app/stores" // Use this to determine active tab
  import type { Snippet } from "svelte"
  import type { ActionData, LayoutData } from "./$types"

  // --- Type Definitions (Keep as is) ---
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

  // --- End Type Definitions ---

  // Props: includes the 'children' snippet for rendering child routes
  let {
    data,
    form,
    children, // <<< Make sure children is destructured
  }: { data: LayoutData; form: ActionData; children: Snippet } = $props()

  // State for editing project name (Keep as is)
  let editingName = $state(false)
  let projectNameInput = $state(data.project?.name ?? "")

  $effect(() => {
    if (!editingName) {
      projectNameInput = data.project?.name ?? ""
    }
  })

  // --- Reactive Bible Sections for Tab Logic (Keep as is) ---
  const bibleSections = $derived([
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
      // isComplete: data.sectionStatus?.design?.isStarted // Or more complex check later
    },
    {
      name: "Functional Spec",
      slug: "functional",
      description: "User experience, platforms, rules...",
      isActive:
        data.sectionStatus?.business?.hasAudience &&
        data.sectionStatus?.business?.hasGoals,
      // isComplete: data.sectionStatus?.functional?.isStarted // Or more complex check later
    },
    {
      name: "Tech Spec",
      slug: "technology",
      description: "Infrastructure, architecture, build...",
      isActive: data.sectionStatus?.functional?.isStarted,
      // isComplete: data.sectionStatus?.technology?.isStarted // Or more complex check later
    },
  ])
  // --- End Reactive Bible Sections ---

  // --- Delete Confirmation Function (Keep as is) ---
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
  // --- End Delete Confirmation Function ---

  // Determine the current active section based on the URL path segment
  let activeSlug = $derived($page.url.pathname.split("/").pop() || "treatment") // Default to treatment if on base project page

  // Add derived state for the market testing prompt for clarity
  let showMarketTestingPrompt = $derived(
    data.sectionStatus?.business?.hasAudience &&
      data.sectionStatus?.business?.hasGoals,
  )
</script>

<div class="p-4 md:p-8 max-w-7xl mx-auto">
  <!-- Header Section (Keep as is) -->
  <div
    class="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
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
        <!-- Edit Name Form (Keep as is) -->
        <form
          method="POST"
          action="?/updateProjectName"
          class="flex items-center"
          use:enhance
        >
          <input
            type="text"
            name="projectName"
            bind:value={projectNameInput}
            class="input input-bordered input-sm md:input-md w-full max-w-xs"
            required
          />
          <button type="submit" class="btn btn-primary btn-sm md:btn-md ml-2"
            >Save</button
          >
          <button
            type="button"
            onclick={() => (editingName = false)}
            class="btn btn-ghost btn-sm md:btn-md ml-1">Cancel</button
          >
          <!-- Specific error display for updateName -->
          {#if form?.action === "updateName" && form?.error}
            <p class="text-error text-sm mt-1 ml-2">{form.error}</p>
          {/if}
        </form>
      {/if}
    </div>

    <!-- Project Actions Dropdown (Keep as is) -->
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
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="m19.5 8.25-7.5 7.5-7.5-7.5"
          /></svg
        >
      </button>
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <ul
        tabindex="0"
        class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
      >
        <li><button onclick={() => (editingName = true)}>Edit Name</button></li>
        <li>
          <form
            method="POST"
            action="?/deleteProject"
            onsubmit={confirmDelete}
            use:enhance
          >
            <button type="submit" class="w-full text-left text-error"
              >Delete Project</button
            >
          </form>
        </li>
      </ul>
    </div>
  </div>
  <!-- End Header Section -->

  <!-- General Form Error Messages (Top Level) -->
  {#if form?.action === "deleteProject" && form?.error}
    <div class="alert alert-error shadow-lg mb-4">
      <span>{form.error}</span>
    </div>
  {/if}
  <!-- Note: updateName error is shown inline above -->
  <!-- End Error Messages -->

  <!-- Tabs for Bible Sections -->
  <div role="tablist" class="tabs tabs-lifted tabs-lg mb-6">
    {#each bibleSections as section (section.slug)}
      {@const isDisabled = !section.isActive}
      {@const isCurrent = section.slug === activeSlug}

      <a
        role="tab"
        href={isDisabled
          ? undefined
          : `/projects/${data.project?.id}/${section.slug}`}
        class:tab-active={!isDisabled && isCurrent}
        class:!bg-base-100={!isDisabled && isCurrent}
        class:text-primary={!isDisabled && isCurrent}
        class:font-semibold={!isDisabled && isCurrent}
        class:tab-disabled={isDisabled}
        class:opacity-50={isDisabled}
        class:cursor-not-allowed={isDisabled}
        class="tab [--tab-bg:hsl(var(--b2))] [--tab-border-color:hsl(var(--b3))] {isDisabled
          ? ''
          : 'hover:bg-base-200'}"
        aria-disabled={isDisabled}
        tabindex={isDisabled ? -1 : 0}
        onclick={(e) => {
          if (isDisabled) e.preventDefault()
        }}
      >
        {section.name}
        {#if isDisabled}
          <!-- Lock Icon -->
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            class="w-4 h-4 ml-1 opacity-70 inline-block align-middle"
          >
            <path
              fill-rule="evenodd"
              d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7A1.5 1.5 0 0 0 3 8.5v3A1.5 1.5 0 0 0 4.5 13h7a1.5 1.5 0 0 0 1.5-1.5v-3A1.5 1.5 0 0 0 11.5 7V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Z"
              clip-rule="evenodd"
            />
          </svg>
        {:else if section.slug === "treatment" && !bibleSections[0].isComplete}
          <!-- Only show "Start Here" on Treatment initially if not complete -->
          <span
            class="badge badge-xs badge-primary ml-1.5 align-middle hidden md:inline-block"
            >Start Here</span
          >
        {:else if section.slug === "business" && bibleSections[0].isComplete && !section.isComplete}
          <!-- Show "Next Step" on Business if Treatment complete but Business is not -->
          <span
            class="badge badge-xs badge-secondary ml-1.5 align-middle hidden md:inline-block"
            >Next Step</span
          >
        {/if}
      </a>
    {/each}
  </div>
  <!-- End Tabs -->

  <!-- Market Testing Prompt (Keep logic as is) -->
  {#if showMarketTestingPrompt}
    <div class="alert alert-info my-6 shadow-md max-w-4xl mx-auto">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        class="stroke-current shrink-0 w-6 h-6"
        ><path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        ></path></svg
      >
      <div>
        <h3 class="font-bold">Ready for Feedback?</h3>
        <div class="text-xs">
          Consider testing your core concept! Exploring initial
          <a
            href="/projects/{data.project?.id}/design"
            class="link link-primary">Design Aesthetics</a
          >
          and
          <a
            href="/projects/{data.project?.id}/functional"
            class="link link-primary">Functional User Journeys</a
          >
          can help create effective test materials.
        </div>
      </div>
    </div>
  {/if}

  <!-- === RENDER CHILD ROUTE CONTENT HERE === -->
  <div class="mt-6">
    {@render children()}
  </div>
  <!-- ====================================== -->
</div>

<style>
  /* Styling for disabled tabs (keep as is or adjust) */
  .tab-disabled {
    color: hsl(var(--bc) / 0.4) !important;
    border-color: hsl(var(--b3) / 0.5) !important;
    border-bottom-width: 1px !important;
    cursor: not-allowed;
  }
  /* Ensure active tab styles override disabled styles if somehow active but disabled (unlikely) */
  .tab-active.tab-disabled {
    opacity: 1;
    cursor: default;
    color: hsl(var(--pc)) !important; /* Primary content color for active */
  }

  /* DaisyUI class cleanup for active tabs using class: directives */
  .tab.tab-active {
    background-color: hsl(var(--b1)); /* Explicitly set active bg */
    /* Other styles handled by class: directives */
  }
</style>
