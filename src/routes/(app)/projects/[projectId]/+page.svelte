<!-- src/routes/(app)/projects/[projectId]/+page.svelte -->

<script lang="ts">
  import { enhance } from "$app/forms"
  import type { ActionData, PageData } from "./$types"
  import { page } from "$app/stores" // Use this to determine active tab

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

  interface ExtendedPageData extends PageData {
    sectionStatus?: SectionStatus
  }
  // --- End Type Definitions ---

  let { data, form }: { data: ExtendedPageData; form: ActionData } = $props()

  // State for editing project name (Keep as is)
  let editingName = $state(false)
  let projectNameInput = $state(data.project?.name ?? "")

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
  ])

  // Determine the current active section based on the URL path segment
  let activeSlug = $derived($page.url.pathname.split("/").pop() || "treatment") // Default to treatment if on base project page
</script>

<div class="p-4 md:p-8 max-w-7xl mx-auto">
  <!-- Market Testing Prompt (Keep logic as is) -->
  {#if data.sectionStatus?.business?.hasAudience && data.sectionStatus?.business?.hasGoals}
    <div class="alert alert-info mt-6 shadow-md max-w-4xl mx-auto">
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

  <!-- Content Area Placeholder -->
  <!-- The actual content for each section will be rendered -->
  <!-- by child route components within a +layout.svelte -->
  <!-- This page might just show a brief welcome or overview -->
  <!-- For now, we leave it empty, assuming the user clicks a tab -->
  <div
    class="mt-6 p-4 bg-base-200 rounded-lg min-h-[200px] text-center flex items-center justify-center"
  >
    <p class="text-base-content/70 italic">
      Select a section above to view or edit.
    </p>
    <!-- OR: You could place the <slot /> here if you were using this as a layout file -->
  </div>
</div>

<style>
</style>
