<script lang="ts">
  import { enhance } from "$app/forms"
  import type { ActionData, PageData } from "./$types"
  import ProjectList from "$lib/components/ProjectList.svelte" // Import the new component
  import { invalidateAll } from "$app/navigation" // Import invalidateAll

  let { data, form }: { data: PageData; form: ActionData } = $props()
  // Ensure pendingInvites is correctly typed based on the server load function change
  type PendingInvite = Pick<
    PageData["pendingInvites"][number], // Infer from PageData if possible
    "id" | "invited_user_email" | "role" | "created_at"
  >
  const {
    team,
    members,
    projects,
    isOwner,
    pendingInvites,
  }: {
    team: PageData["team"]
    members: PageData["members"]
    projects: PageData["projects"]
    isOwner: PageData["isOwner"]
    pendingInvites: PendingInvite[] // Use the specific type here too
  } = data

  let editingName = $state(false)
  let teamNameInput = $state(team.name)

  // --- New State for Editing Roles ---
  let editingRoleId = $state<string | null>(null) // Track which user's role is being edited
  let newRoleInput = $state("member") // Holds the value for the select input

  // --- New State for Invite Modal ---
  let showInviteModal = $state(false)
  let inviteEmail = $state("")
  let inviteRole = $state("member") // Default role for new invites

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

  // Effect to handle form submission results for inviteMember
  $effect(() => {
    if (form?.action === "inviteMember" && form?.success) {
      showInviteModal = false // Close modal on success
      inviteEmail = "" // Reset form
      inviteRole = "member"
      // No need for invalidateAll here if enhance handles it, but explicit is okay too
      // invalidateAll() // Refresh data, including pending invites
    }
    // Keep modal open on error to show the message
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
    newRoleInput = currentRole // Set initial value for select
  }

  function cancelEditingRole() {
    editingRoleId = null
  }

  // Removed confirmRevokeInvite function, logic moved to use:enhance
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
          <form
            method="POST"
            action="?/updateTeamName"
            use:enhance
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
          <!-- Changed button to open modal -->
          <button
            onclick={() => (showInviteModal = true)}
            class="btn btn-sm btn-primary">Invite Member</button
          >
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
                      use:enhance
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
                      use:enhance
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

    <!-- *** NEW: Pending Invitations Section *** -->
    {#if isOwner && pendingInvites && pendingInvites.length > 0}
      <section class="space-y-4">
        <h2 class="text-2xl font-semibold">Pending Invitations</h2>
        {#if form?.action === "revokeInvite" && form?.error && (!("failedInviteId" in form) || form.failedInviteId == null)}
          <!-- Display general errors not tied to a specific invite -->
          <p class="text-error text-sm">Error revoking invite: {form.error}</p>
        {/if}
        {#if form?.action === "revokeInvite" && form?.success}
          <!-- General success message -->
          <!-- <p class="text-success text-sm">{form.message}</p> -->
          <!-- Consider using a toast notification for success -->
        {/if}
        <ul class="list-disc pl-5 space-y-2">
          {#each pendingInvites as invite (invite.id)}
            <li class="flex justify-between items-center">
              <div>
                <span>{invite.invited_user_email}</span>
                <span class="text-gray-500 ml-2">({invite.role})</span>
                <span class="text-gray-400 text-sm ml-2"
                  >Invited: {new Date(
                    invite.created_at,
                  ).toLocaleDateString()}</span
                >
              </div>
              <div>
                <!-- Revoke Invite Form - Updated enhance handler -->
                <form
                  method="POST"
                  action="?/revokeInvite"
                  use:enhance={({ formElement, cancel }) => {
                    // Get the email from the data attribute for the confirmation
                    const inviteEmail =
                      formElement.dataset.inviteEmail ?? "this invitation"
                    // Ask for confirmation BEFORE submitting
                    if (
                      !window.confirm(
                        `Are you sure you want to revoke the invitation for ${inviteEmail}?`,
                      )
                    ) {
                      cancel() // Cancel the submission if user clicks 'Cancel'
                    }

                    // Return the callback for handling the result
                    return async ({ update }) => {
                      // We don't need reset: false here anymore as default behavior is fine
                      // invalidateAll() will be triggered by the action return if needed
                      await update()
                    }
                  }}
                  data-invite-email={invite.invited_user_email}
                  class="inline-block"
                >
                  <input type="hidden" name="invitationId" value={invite.id} />
                  <button type="submit" class="btn btn-xs btn-warning btn-ghost"
                    >Revoke</button
                  >
                </form>
                <!-- Display error specific to this invite -->
                {#if form?.action === "revokeInvite" && form?.error && "failedInviteId" in form && form.failedInviteId === invite.id}
                  <span class="text-error text-xs ml-1">{form.error}</span>
                {/if}
              </div>
            </li>
          {/each}
        </ul>
      </section>
    {/if}
    <!-- *** END: Pending Invitations Section *** -->

    <section class="space-y-4">
      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-semibold">Projects</h2>
        <!-- Add Create Project Button -->
        <a
          href="/projects/create?teamId={team.id}"
          class="btn btn-sm btn-secondary">Create New Project</a
        >
      </div>
      <ProjectList {projects}>
        {#snippet emptyContent()}
          <!-- Changed slot="empty" to #snippet emptyContent() -->
          <p>This team hasn't been assigned any projects yet.</p>
        {/snippet}
      </ProjectList>
    </section>
  {:else}
    <p>Loading team details...</p>
  {/if}
</div>

<!-- *** Invite Member Modal - Updated enhance handler *** -->
{#if showInviteModal}
  <dialog id="invite_member_modal" class="modal modal-open">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-4">Invite New Member</h3>
      <form
        method="POST"
        action="?/inviteMember"
        use:enhance={() => {
          // This callback runs AFTER the form submission result is known
          return async ({ update }) => {
            // Update the page data (will clear form on success via $effect)
            await update()
            // The $effect handles closing modal and resetting state on success now
          }
        }}
        class="space-y-4"
      >
        <div>
          <label for="invite-email" class="label">
            <span class="label-text">Email Address</span>
          </label>
          <input
            id="invite-email"
            type="email"
            name="email"
            bind:value={inviteEmail}
            placeholder="member@example.com"
            class="input input-bordered w-full"
            required
          />
        </div>
        <div>
          <label for="invite-role" class="label">
            <span class="label-text">Role</span>
          </label>
          <select
            id="invite-role"
            name="role"
            bind:value={inviteRole}
            class="select select-bordered w-full"
            required
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {#if form?.action === "inviteMember" && form?.error}
          <p class="text-error text-sm">{form.error}</p>
        {/if}
        <!-- Success message is implicitly handled by modal closing -->

        <div class="modal-action mt-6">
          <button
            type="button"
            onclick={() => (showInviteModal = false)}
            class="btn btn-ghost"
          >
            Cancel
          </button>
          <button type="submit" class="btn btn-primary">Send Invitation</button>
        </div>
      </form>
    </div>
    <!-- Optional: click outside to close -->
    <form method="dialog" class="modal-backdrop">
      <button type="button" onclick={() => (showInviteModal = false)}
        >close</button
      >
    </form>
  </dialog>
{/if}

<!-- *** END: Invite Member Modal *** -->

<style>
  /* Optional: Add any custom styles if needed */
</style>
