<script lang="ts">
  import { enhance } from "$app/forms"
  import type { ActionData, PageData } from "./$types"

  let { data, form }: { data: PageData; form: ActionData } = $props()
  const { team, members, projects, isOwner } = data

  let editingName = $state(false)
  let teamNameInput = $state(team.name)

  $effect(() => {
    // Check for the specific action's success
    if (form?.action === "updateName" && form?.success && !editingName) {
      console.log(form.message)
    }
    // Update local state if team name changes (regardless of action source for now)
    if (!editingName) {
      teamNameInput = team.name
    }
    // Handle delete error display (though successful delete redirects)
    if (form?.action === "deleteTeam" && form?.error) {
      // Maybe show a toast notification or log the error
      console.error("Delete Team Error:", form.error)
      // alert(`Error: ${form.error}`) // Simple alert for now
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

  // TODO: Add logic for forms and actions (edit name, delete team, invite/remove/update member)
</script>

<div class="container mx-auto max-w-4xl p-4 space-y-8">
  <section class="space-y-4">
    <div class="flex justify-between items-center">
      {#if !editingName}
        <h1 class="text-3xl font-bold">Team: {team.name}</h1>
      {:else}
        <form
          method="POST"
          action="?/updateTeamName"
          use:enhance={() => {
            return async ({ update }) => {
              editingName = false
              await update({ reset: false }) // Prevent full form reset if needed
            }
          }}
          class="flex-grow mr-4"
        >
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
          <!-- Check action first, then error, then specific fields -->
          {#if form?.action === "updateName" && form?.error && form.currentName}
            <p class="text-error text-sm mt-1">{form.error}</p>
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
          <form
            method="POST"
            action="?/deleteTeam"
            use:enhance
            onsubmit={confirmDelete}
          >
            <button type="submit" class="btn btn-sm btn-error btn-outline"
              >Delete Team</button
            >
          </form>
        </div>
      {/if}
    </div>
    <!-- Show general errors for this action if currentName is NOT set -->
    {#if form?.action === "updateName" && form?.error && !form.currentName}
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
    {#if members.length > 0}
      <ul class="list-disc pl-5 space-y-2">
        {#each members as member}
          <li class="flex justify-between items-center">
            <div>
              <!-- Access profile data assuming it might be an array according to TS -->
              <span>{member.profiles?.[0]?.full_name ?? member.user_id}</span>
              <span class="text-gray-500 ml-2">({member.role})</span>
              {#if member.user_id === team.owner_user_id}
                <span class="badge badge-outline badge-primary ml-2">Owner</span
                >
              {/if}
            </div>
            {#if isOwner && member.user_id !== team.owner_user_id}<!-- Only owner can manage, and cannot manage themselves -->
              <div>
                <!-- TODO: Add Role Change Controls -->
                <button class="btn btn-xs btn-ghost mr-1">Change Role</button>
                <!-- TODO: Add Remove Member Confirmation/Action -->
                <button class="btn btn-xs btn-error btn-ghost">Remove</button>
              </div>
            {/if}
          </li>
        {/each}
      </ul>
    {:else}
      <p>No members in this team yet.</p>
    {/if}
  </section>

  <section class="space-y-4">
    <h2 class="text-2xl font-semibold">Projects</h2>
    {#if projects.length > 0}
      <ul class="list-disc pl-5 space-y-2">
        {#each projects as project}
          <li>{project.name}</li>
          <!-- TODO: Maybe link to project page? -->
        {/each}
      </ul>
    {:else}
      <p>This team hasn't been assigned any projects yet.</p>
    {/if}
  </section>
</div>
