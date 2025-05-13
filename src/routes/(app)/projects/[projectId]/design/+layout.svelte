<!-- src/routes/(app)/projects/[projectId]/business/+layout.svelte -->
<script lang="ts">
  import type { Snippet } from "svelte"
  import { goto } from "$app/navigation"
  // We might need LayoutData if we need projectId, but $page should suffice
  // import type { LayoutData } from './$types';
  import { page } from "$app/stores"

  // Explicitly type children for Svelte 5
  let { children }: { children: Snippet } = $props()

  const projectId = $page.params.projectId
  const basePath = `/projects/${projectId}/design`

  function getPath(subpath: string) {
    return `${basePath}/${subpath}`
  }

  // List of main business sections (excluding goals, which is handled separately)
  const mainDesignSections = [
    { name: "Aesthetic", slug: "aesthetic" },
    { name: "Branding", slug: "branding" },
    { name: "Storyboards", slug: "storyboards" },
    { name: "Wireframes", slug: "wireframes" },
    { name: "Style Guide", slug: "style_guide" },
    { name: "Media Styles", slug: "media_styles" },
    { name: "Assets List", slug: "assets_list" },
    // Add other top-level sections here later (e.g., Business Models, IP/Licensing)
  ]
</script>

<div class="flex flex-col md:flex-row gap-8">
  <!-- Sub-navigation Sidebar -->
  <aside class="w-full md:w-1/4 lg:w-1/5 md:sticky md:top-24 self-start">
    <ul class="menu bg-base-200 rounded-box p-2 text-base">
      <!-- Back to Project Overview (Optional but good UX) -->
      <li>
        <a href="/projects/{$page.params.projectId}">← Project Overview</a>
      </li>
      <li class="menu-title pt-4">Design Section</li>

      <!-- Other Main Business Sections -->
      {#each mainDesignSections as section}
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
    </ul>
  </aside>

  <!-- Main Content Area for the specific subsection -->
  <main class="w-full md:w-3/4 lg:w-4/5">
    {@render children()}
  </main>
</div>

<style>
  /* Ensure active state looks right */
  .menu li > a.active {
    /* DaisyUI usually handles this, but you can override */
    font-weight: 600;
    background-color: hsl(var(--p) / 0.1);
  }
</style>
