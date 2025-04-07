<!-- src/routes/(app)/dashboard/+page.svelte -->
<script lang="ts">
  import type { PageData } from "./$types"
  // import type { DashboardProject } from "$lib/types"

  export let data: PageData

  // Correctly derive hasTeams from the 'userTeams' property returned by the layout load
  $: hasTeams = data.userTeams && data.userTeams.length > 0
  $: projects = data.projects
  // $: console.log("userTeams", data.userTeams)
  // $: console.log("Complete data prop in +page.svelte:", data)

  // Placeholder for projects data - needs to be loaded separately
  // $: hasProjects = data.dashboardProjects && data.dashboardProjects.length > 0
  $: hasProjects = projects && projects.length > 0
  // console.log("hasProjects", hasProjects)
</script>

{#if !hasTeams}
  <!-- EMPTY STATE: User has no teams -->
  <div class="hero min-h-[calc(100vh-theme(spacing.24))] bg-base-200">
    <div class="hero-content text-center">
      <div class="max-w-md">
        <!-- Use profile data from layout -->
        <h1 class="text-5xl font-bold">
          Welcome, {data.profile?.full_name ?? data.user?.email ?? "User"}!
        </h1>
        <p class="py-6">
          Ready to build your transmedia world? In Nanowrit Labs, all projects
          live inside Teams. Create a team for your solo work or to collaborate
          with others.
        </p>
        <a href="/teams/create" class="btn btn-primary"
          >Create Your First Team</a
        >
      </div>
    </div>
  </div>
{:else}
  <!-- POPULATED STATE: User has teams -->
  <div class="mx-auto max-w-4xl">
    <h1 class="text-3xl font-bold mb-4">Your Dashboard</h1>

    <section class="mb-8">
      <h2 class="text-2xl mb-2">Your Teams</h2>
      <!-- Correctly loop over 'userTeams' -->
      {#each data.userTeams as teamMembership}
        {#if teamMembership.teams}
          <div class="card bg-base-100 shadow-xl mb-4">
            <div class="card-body">
              <h3 class="card-title">{teamMembership.teams.name}</h3>
              <p>Your role: {teamMembership.role}</p>
              <div class="card-actions justify-end">
                <a
                  href="/projects/create?teamId={teamMembership.teams.id}"
                  class="btn btn-secondary btn-sm">Create Project</a
                >
                <a
                  href="/teams/{teamMembership.teams.id}"
                  class="btn btn-ghost btn-sm">View Team</a
                >
              </div>
            </div>
          </div>
        {/if}
      {:else}
        <p>Something went wrong loading your teams.</p>
      {/each}
      <a href="/teams/create" class="btn btn-outline mt-4">Create New Team</a>
    </section>

    <section>
      <h2 class="text-2xl mb-2">Your Projects</h2>
      <!-- NOTE: 'projects' data is NOT loaded yet by layout -->
      <!-- You will need to load projects specifically for the dashboard later -->
      <!-- Replace the check below with one for dashboard-specific project data -->
      {#if hasProjects}
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
                    <!-- Link to the specific project page -->
                    <a href={`/projects/${project.id}`} class="hover:underline">
                      {project.name || "Unnamed Project"}
                    </a>
                  </p>
                  <p
                    class="mt-1 truncate text-xs leading-5 text-gray-500 dark:text-gray-400"
                  >
                    <!-- {project.description || "No description"} -->
                  </p>
                </div>
              </div>
              <div class="hidden shrink-0 sm:flex sm:flex-col sm:items-end">
                <!-- Add relevant actions or info here, e.g., last updated -->
                <p class="text-sm leading-6 text-gray-900 dark:text-white">
                  <!-- Example: Status or role -->
                </p>
                <p
                  class="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400"
                >
                  <!-- Example: Last updated time -->
                  <!-- Last updated <time datetime={project.lastUpdatedDateTime}>{project.lastUpdated}</time> -->
                </p>
                <!-- Or maybe a direct 'View' link -->
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
        <div class="p-4 bg-base-200 rounded-md text-center">
          <p>You haven't created any projects yet.</p>
          <p class="text-sm mt-1">
            Select a team above and click "Create Project".
          </p>
        </div>
      {/if}
    </section>
  </div>
{/if}
