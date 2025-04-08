<script lang="ts">
  import type { Snippet } from "svelte" // Import Snippet type

  // TODO: Replace with actual import from database types if available
  // e.g., import type { definitions } from '$lib/types/database.types';
  // type Project = definitions['projects'];
  type Project = {
    id: string
    name: string | null
    // Add other relevant fields from your project type if needed
  }

  let {
    projects,
    emptyContent,
  }: {
    projects: Project[]
    emptyContent: Snippet<[]> // Define the prop type
  } = $props()
</script>

{#if projects.length > 0}
  <ul role="list" class="divide-y divide-gray-200 dark:divide-gray-700">
    {#each projects as project (project.id)}
      <li class="flex justify-between gap-x-6 py-5">
        <div class="flex min-w-0 gap-x-4">
          <!-- Potential project icon/image placeholder -->
          <!-- <img class="h-12 w-12 flex-none rounded-full bg-gray-50" src={project.imageUrl} alt=""> -->
          <div class="min-w-0 flex-auto">
            <p
              class="text-sm font-semibold leading-6 text-gray-900 dark:text-white"
            >
              <a href={`/projects/${project.id}`} class="hover:underline">
                {project.name || "Unnamed Project"}
              </a>
            </p>
            <p
              class="mt-1 truncate text-xs leading-5 text-gray-500 dark:text-gray-400"
            >
              <!-- Optional: Add project description if available -->
              <!-- {project.description || "No description"} -->
            </p>
          </div>
        </div>
        <div class="hidden shrink-0 sm:flex sm:flex-col sm:items-end">
          <!-- Add relevant actions or info here, e.g., last updated -->
          <p class="text-sm leading-6 text-gray-900 dark:text-white">
            <!-- Example: Status or role -->
          </p>
          <p class="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
            <!-- Example: Last updated time -->
            <!-- Last updated <time datetime={project.lastUpdatedDateTime}>{project.lastUpdated}</time> -->
          </p>
          <a
            href={`/projects/${project.id}`}
            class="text-sm leading-6 text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >View<span class="sr-only">, {project.name}</span></a
          >
        </div>
      </li>
    {/each}
  </ul>
{:else}
  {@render emptyContent()}
{/if}
