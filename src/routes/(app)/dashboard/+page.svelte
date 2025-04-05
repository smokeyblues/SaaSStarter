<!-- <div class="min-h-[60vh]">
  <div class="pt-20 pb-8 px-7">
    <div class="max-w-lg mx-auto">
      <h1
        class="ext-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-linear-to-r from-primary to-accent pb-2"
      >
        Dashboard
      </h1>
    </div>
  </div>
</div> -->

<!-- src/routes/(app)/dashboard/+page.svelte -->
<script lang="ts">
  import type { PageData } from "./$types"

  export let data: PageData

  // Correctly derive hasTeams from the 'userTeams' property returned by the layout load
  $: hasTeams = data.userTeams && data.userTeams.length > 0

  // Placeholder for projects data - needs to be loaded separately
  // $: hasProjects = data.dashboardProjects && data.dashboardProjects.length > 0;
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
  <div>
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
                <button class="btn btn-secondary btn-sm">Create Project</button>
                <button class="btn btn-ghost btn-sm">View Team</button>
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
      {#if false}
        <!-- Placeholder: Replace 'false' -->
        <p>Display projects here...</p>
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
