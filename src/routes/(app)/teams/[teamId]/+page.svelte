<script lang="ts">
  import { enhance } from "$app/forms"
  import type { ActionData, PageData } from "./$types"

  let { data, form }: { data: PageData; form: ActionData } = $props()
  const { team, members, projects, isOwner } = data

  let editingName = $state(false)
  let teamNameInput = $state(team.name)

  // --- New State for Editing Roles ---
  let editingRoleId = $state<string | null>(null) // Track which user's role is being edited
  let newRoleInput = $state("member") // Holds the value for the select input

  $effect(() => {
    // Simpler effect: Update input only if not editing
    if (!editingName) {
      teamNameInput = team?.name ?? "" // Add null check for team
    }
    // Reset role input if editing stops
    if (!editingRoleId) {
      newRoleInput = "member" // Reset to default
    }
  })

  function confirmDelete(event: SubmitEvent) {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this team? This action cannot be undone.",
      )
    ) {
      event.preventDefault() // Stop form submission
    }
  }

  // New function for remove confirmation
  function confirmRemoveMember(event: SubmitEvent) {
    const form = event.target as HTMLFormElement
    const memberName = form.dataset.memberName || "this member" // Get name from data attribute
    if (
      !window.confirm(
        `Are you sure you want to remove ${memberName} from the team?`,
      )
    ) {
      event.preventDefault() // Stop submission if user cancels
    }
  }

  function startEditingRole(memberUserId: string, currentRole: string) {
    editingRoleId = memberUserId
  }

  function cancelEditingRole() {
    editingRoleId = null
  }

  // TODO: Add logic for forms and actions (edit name, delete team, invite/remove/update member)
</script>

<div class="container mx-auto max-w-4xl p-4 space-y-8">
  <!-- TODO: move breadcrumbs to (app)/+layout.svelte -->
  <div class="text-sm breadcrumbs mb-1">
    <ul>
      <li><a href="/dashboard">Dashboard</a></li>
      {#if data.team}
        <li><a href="/teams/{data.team.id}">{data.team.name}</a></li>
      {/if}
    </ul>
  </div>
  {#if team}
    <section class="space-y-4">
      <div class="flex justify-between items-center">
        {#if !editingName}
          <h1 class="text-3xl font-bold">Team: {team.name}</h1>
        {:else}
          <form method="POST" action="?/updateTeamName" class="flex-grow mr-4">
            <input
              type="text"
              name="teamName"
              bind:value={teamNameInput}
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

        {#if isOwner && !editingName}
          <div class="flex items-center space-x-2">
            <button
              onclick={() => (editingName = true)}
              class="btn btn-sm btn-outline">Edit Name</button
            >
            <!-- Delete Team Form -->
            <form method="POST" action="?/deleteTeam" onsubmit={confirmDelete}>
              <button type="submit" class="btn btn-sm btn-error btn-outline"
                >Delete Team</button
              >
            </form>
          </div>
        {/if}
      </div>
      <!-- Show general errors for this action if currentName is NOT set -->
      {#if form?.action === "updateName" && form?.error && (!("currentName" in form) || form.currentName === undefined)}
        <p class="text-error text-sm">{form.error}</p>
      {/if}
      <!-- General Delete Team Error -->
      {#if form?.action === "deleteTeam" && form?.error}
        <p class="text-error text-sm">{form.error}</p>
      {/if}
    </section>

    <section class="space-y-4">
      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-semibold">Members</h2>
        {#if isOwner}
          <!-- TODO: Add Invite Member Form/Modal Trigger -->
          <button class="btn btn-sm btn-primary">Invite Member</button>
        {/if}
      </div>
      {#if members && members.length > 0}
        <ul class="list-disc pl-5 space-y-2">
          {#each members as member}
            {@const memberDisplayName =
              member.profiles?.full_name ?? member.user_id}
            <!-- {@const _ = console.log('Member Data:', member)} {/* Keep if needed */} -->
            <li class="flex justify-between items-center">
              <div>
                <span>{memberDisplayName}</span>
                <span class="text-gray-500 ml-2">({member.role})</span>
                {#if member.user_id === team.owner_user_id}
                  <span class="badge badge-outline badge-primary ml-2"
                    >Owner</span
                  >
                {/if}
              </div>
              {#if isOwner && member.user_id !== team.owner_user_id}
                <div class="flex items-center space-x-1">
                  {#if editingRoleId === member.user_id}
                    <!-- Role Change Form -->
                    <form
                      method="POST"
                      action="?/changeMemberRole"
                      class="inline-flex items-center space-x-1"
                    >
                      <input
                        type="hidden"
                        name="memberUserId"
                        value={member.user_id}
                      />
                      <select
                        name="newRole"
                        bind:value={newRoleInput}
                        class="select select-bordered select-xs"
                        required
                      >
                        <!-- Define allowable roles here -->
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                        <!-- Add other roles as needed, excluding 'owner' -->
                      </select>
                      <button type="submit" class="btn btn-xs btn-primary"
                        >Save</button
                      >
                      <button
                        type="button"
                        onclick={cancelEditingRole}
                        class="btn btn-xs btn-ghost"
                      >
                        Cancel
                      </button>
                    </form>
                    <!-- Safely check for failedUserId before accessing -->
                    {#if form?.action === "changeMemberRole" && form?.error && "failedUserId" in form && form.failedUserId === member.user_id}
                      <span class="text-error text-xs ml-1">{form.error}</span>
                    {/if}
                  {:else}
                    <!-- Change Role Button -->
                    <button
                      onclick={() =>
                        startEditingRole(member.user_id, member.role)}
                      class="btn btn-xs btn-ghost"
                    >
                      Change Role
                    </button>

                    <!-- Remove Member Form -->
                    <form
                      method="POST"
                      action="?/removeMember"
                      onsubmit={confirmRemoveMember}
                      data-member-name={`${memberDisplayName}`}
                      class="inline-block"
                    >
                      <input
                        type="hidden"
                        name="memberUserId"
                        value={member.user_id}
                      />
                      <button
                        type="submit"
                        class="btn btn-xs btn-error btn-ghost">Remove</button
                      >
                    </form>
                    <!-- Remove member error display (already safe) -->
                    {#if form?.action === "removeMember" && form?.error && "failedUserId" in form && form.failedUserId === member.user_id}
                      <span class="text-error text-xs ml-1">{form.error}</span>
                    {/if}
                  {/if}
                </div>
              {/if}
            </li>
          {/each}
        </ul>
      {:else}
        <p>No members in this team yet.</p>
      {/if}
      <!-- General Errors (already safe) -->
      {#if form?.action === "removeMember" && form?.error && (!("failedUserId" in form) || form.failedUserId == null)}
        <p class="text-error text-sm mt-2">{form.error}</p>
      {/if}
      {#if form?.action === "changeMemberRole" && form?.error && (!("failedUserId" in form) || form.failedUserId == null)}
        <p class="text-error text-sm mt-2">{form.error}</p>
      {/if}
    </section>

    <section class="space-y-4">
      <h2 class="text-2xl font-semibold">Projects</h2>
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
        <p>This team hasn't been assigned any projects yet.</p>
      {/if}
    </section>
  {:else}
    <p>Loading team details...</p>
  {/if}
</div>
