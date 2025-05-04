<!-- src/routes/(app)/projects/[projectId]/business/+layout.svelte -->
<script lang="ts">
  import type { Snippet } from "svelte"
import { goto } from '$app/navigation';
  // We might need LayoutData if we need projectId, but $page should suffice
  // import type { LayoutData } from './$types';
  import { page } from "$app/stores"

  // Explicitly type children for Svelte 5
  let { children }: { children: Snippet } = $props()

  const projectId = $page.params.projectId
  const basePath = `/projects/${projectId}/business`

  function getPath(subpath: string) {
    return `${basePath}/${subpath}`
  }

  function getGoalPath(subpath: string) {
    return `${basePath}/goals/${subpath}`
  }

  // List of main business sections (excluding goals, which is handled separately)
  const mainBusinessSections = [
    { name: "Success Indicators", slug: "success_indicators" },
    { name: "User Need", slug: "user_need" },
    { name: "Target Audience & Marketing", slug: "audience" },
    // Add other top-level sections here later (e.g., Business Models, IP/Licensing)
  ]

  // Sub-sections for Goals
  const goalSubSections = [
    { name: "User Goals", slug: "user" },
    { name: "Creative Goals", slug: "creative" },
    { name: "Economic Goals", slug: "economic" },
  ]

  function handleGoalsTextClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation(); // Prevents details toggle
    goto(getPath('goals'));
  }

  function handleGoalsTextKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      goto(getPath('goals'));
    }
  }
</script>

<div class="flex flex-col md:flex-row gap-8">
  <!-- Sub-navigation Sidebar -->
  <aside class="w-full md:w-1/4 lg:w-1/5 md:sticky md:top-24 self-start">
    <ul class="menu bg-base-200 rounded-box p-2 text-base">
      <!-- Back to Project Overview (Optional but good UX) -->
      <li>
        <a href="/projects/{$page.params.projectId}">← Project Overview</a>
      </li>
      <li class="menu-title pt-4">Business Section</li>

      <!-- Goals Section - Using <details> -->
      <li>
        <details open={$page.url.pathname.startsWith(getPath("goals"))}>
          <summary class="flex justify-between items-center w-full">
            <span
              style="cursor: pointer; user-select: none;"
              onclick={handleGoalsTextClick}
              onkeydown={handleGoalsTextKeydown}
              role="button"
              tabindex="0"
              class="font-semibold"
            >
              Goals
            </span>
            <!-- DaisyUI might add its own marker, or you can keep yours -->
            <!-- If keeping, you might need JS to check the 'open' attr or use CSS :details[open] summary::after -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              class="w-4 h-4 ml-auto opacity-60 transition-transform details-marker"
              ><!-- Class added for potential CSS targeting -->
              <path
                fill-rule="evenodd"
                d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z"
                clip-rule="evenodd"
              />
            </svg>
          </summary>

          <!-- Nested UL for Goal Sub-sections -->
          <ul class="pl-4 pt-1 menu-dropdown">
            <!-- DaisyUI should style this -->
            {#each goalSubSections as subSection}
              <li>
                <a
                  href={getGoalPath(subSection.slug)}
                  class={$page.url.pathname.endsWith(`/${subSection.slug}`) ||
                  ($page.url.pathname === getPath("goals") &&
                    subSection.slug === "user")
                    ? "active"
                    : ""}
                >
                  {subSection.name}
                </a>
              </li>
            {/each}
          </ul>
        </details>
      </li>

      <!-- Other Main Business Sections -->
      {#each mainBusinessSections as section}
        <li>
          <a
            href={getPath(section.slug)}
            class={$page.url.pathname.endsWith(`/${section.slug}`)
              ? "active"
              : ""}
          >
            <!-- Use inner div for potential line break control if needed -->
            <div>{section.name}</div>
          </a>
        </li>
      {/each}

      <!-- Add placeholders for future sections -->
      <li><span class="disabled opacity-50">Business Models (Soon)</span></li>
      <li><span class="disabled opacity-50">Projections (Soon)</span></li>
      <li><span class="disabled opacity-50">Team (Soon)</span></li>
      <li><span class="disabled opacity-50">IP/Licensing (Soon)</span></li>
    </ul>
  </aside>

  <!-- Main Content Area for the specific subsection -->
  <main class="w-full md:w-3/4 lg:w-4/5">
    {@render children()}
  </main>
</div>

<style>
  /* Optional: Add slight transition for the dropdown appearance */
  /* REMOVE or comment out the .menu-dropdown style */
  .menu-dropdown {
    max-height: 500px;
    overflow: hidden;
    transition: max-height 0.3s ease-in-out;
  }

  /* Ensure active state looks right */
  .menu li > a.active {
    /* DaisyUI usually handles this, but you can override */
    font-weight: 600;
    background-color: hsl(var(--p) / 0.1);
  }

  /* Style the details marker rotation if DaisyUI doesn't handle it */
  details[open] > summary .details-marker {
    transform: rotate(90deg);
  }
  details > summary .details-marker {
    transition: transform 0.2s ease-in-out; /* Add transition to chevron */
  }

  /* Optional: Remove default marker if you use your own SVG */
  details > summary {
    list-style: none !important;
  }
  details > summary::-webkit-details-marker {
    display: none !important;
  }
  details > summary::after {
    display: none !important;
    font-size: 0 !important;
    color: transparent !important;
  }
</style>
