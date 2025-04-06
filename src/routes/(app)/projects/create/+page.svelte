<!-- src/routes/(app)/projects/create/+page.svelte -->
<script lang="ts">
  import { enhance } from "$app/forms"
  // Import PageData to get types from the load function
  // Also import ActionData for form action return types
  import type { PageData, ActionData } from "./$types"

  // Define the expected structure of form action errors
  interface FailureProps {
    projectName?: string // Submitted project name value
    teamId?: string // Submitted teamId value (for completeness)
    missingProject?: boolean // Flag for empty project name
    error?: boolean // Flag for general server error
    message?: string // Error message to display
  }

  // Get data loaded by +page.server.ts (teamId, teamName)
  export let data: PageData
  // Get potential error data back from form submission action
  export let form: FailureProps | null = null

  // Use the teamId passed from the load function
  let teamIdValue = data.teamId
  // Local variable for the project name input
  let projectNameValue = ""

  // Reactive statement to update local var if form error occurs
  $: projectNameValue = form?.projectName ?? ""

  let submitting = false
</script>

<div class="flex justify-center items-start pt-16 min-h-screen bg-base-200">
  <div class="card w-full max-w-lg bg-base-100 shadow-xl">
    <!-- Use max-w-lg for slightly wider card -->
    <div class="card-body">
      <h1 class="card-title text-2xl mb-1">Create New Project</h1>
      {#if data.teamName}
        <p class="text-neutral-500 mb-4">
          For Team: <span class="font-semibold">{data.teamName}</span>
        </p>
      {/if}

      <form
        method="POST"
        use:enhance={() => {
          submitting = true
          return async ({ update }) => {
            // Don't reset form fields on validation error
            await update({ reset: false })
            submitting = false
          }
        }}
      >
        <!-- Hidden input to send the validated teamId back -->
        <input type="hidden" name="teamId" bind:value={teamIdValue} />

        <!-- Project Name Input -->
        <div class="form-control w-full mb-4">
          <label class="label" for="projectName">
            <span class="label-text">Project Name</span>
          </label>
          <input
            type="text"
            id="projectName"
            name="projectName"
            placeholder="e.g., Interstellar Odyssey"
            class="input input-bordered w-full {form?.missingProject ||
            form?.error
              ? 'input-error'
              : ''}"
            aria-invalid={form?.missingProject || form?.error
              ? "true"
              : undefined}
            bind:value={projectNameValue}
            disabled={submitting}
            required
          />
          {#if form?.missingProject}
            <label class="label" for="projectName">
              <span class="label-text-alt text-error"
                >Project name cannot be empty.</span
              >
            </label>
          {/if}
          {#if form?.error && form?.message}
            <label class="label" for="projectName">
              <span class="label-text-alt text-error">{form.message}</span>
            </label>
          {/if}
        </div>

        <!-- Maybe add other fields later (description, etc.) -->

        <div class="card-actions justify-end mt-6">
          <!-- Link back to the specific team's page maybe? Or dashboard? -->
          <a
            href="/dashboard"
            class="btn btn-ghost"
            class:btn-disabled={submitting}>Cancel</a
          >
          <button
            type="submit"
            class="btn btn-primary"
            class:loading={submitting}
            disabled={submitting}
          >
            {#if !submitting}
              Create Project
            {:else}
              Creating...
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
</div>
