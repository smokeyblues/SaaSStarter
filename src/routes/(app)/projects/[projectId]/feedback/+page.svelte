<script lang="ts">
  import { enhance } from "$app/forms"
  import { invalidateAll } from "$app/navigation"
  import type { ActionData, PageData } from "./$types" // Ensure $types is correct for this route

  let { data, form }: { data: PageData; form: ActionData } = $props()

  let feedbackLogs = $derived(data.feedbackLogs ?? [])
  let currentFormFeedback = $state<ActionData>(null) // Renamed to avoid conflict if other forms added

  // Reactive state for the 'Other' platform input
  let selectedPlatform = $state("")
  let showCustomPlatformInput = $derived(selectedPlatform === "other")

  // Common platform options
  const commonPlatforms = [
    "Discord",
    "Twitter / X",
    "Facebook",
    "Instagram",
    "Reddit",
    "YouTube",
    "TikTok",
    "User Testing Session",
    "Focus Group",
    "Email",
    "Survey",
    "In-Person Conversation",
  ]

  $effect(() => {
    currentFormFeedback = form
    if (form?.success && form?.action === "addFeedbackLog") {
      // Reset selectedPlatform if a custom one was used or form needs clearing
      // This assumes your form resets inputs on success. If not, you might need to do it manually.
      selectedPlatform = ""
      // document.getElementById('addFeedbackForm')?.reset(); // Optionally reset form fields

      invalidateAll() // Refresh data
      const timer = setTimeout(() => {
        currentFormFeedback = null
      }, 3000)
      return () => clearTimeout(timer)
    }
  })
</script>

<section class="space-y-8">
  <div>
    <h2 class="text-3xl font-semibold mb-2">Project Feedback Log</h2>
    <p class="text-base-content/70">
      Record insights and reactions gathered from sharing your project concepts.
    </p>
  </div>

  <!-- Add New Feedback Entry Form -->
  <div class="card bg-base-200 shadow-md p-6">
    <h3 class="text-xl font-semibold mb-4">Add New Feedback Entry</h3>
    <form
      method="POST"
      action="?/addFeedbackLog"
      use:enhance
      class="space-y-4"
      id="addFeedbackForm"
    >
      <div>
        <label for="shared_item_description" class="label">
          <span class="label-text">Shared Item/Concept</span>
          <span class="label-text-alt"
            >What did you share? (e.g., Tagline v1, Character Art)</span
          >
        </label>
        <textarea
          name="shared_item_description"
          id="shared_item_description"
          class="textarea textarea-bordered w-full"
          placeholder="e.g., Synopsis draft shared on Discord"
          rows="2"
          required
          value={(form?.action === "addFeedbackLog" &&
            typeof form?.formData?.shared_item_description === "string" &&
            form?.error &&
            form.formData?.shared_item_description) ||
            ""}
        ></textarea>
      </div>

      <div>
        <label for="platform_source" class="label">
          <span class="label-text">Platform / Source</span>
          <span class="label-text-alt">Where did you get this feedback?</span>
        </label>
        <select
          name="platform_source"
          id="platform_source"
          class="select select-bordered w-full"
          bind:value={selectedPlatform}
          required
        >
          <option disabled selected={!selectedPlatform} value=""
            >Select a platform</option
          >
          {#each commonPlatforms as platform}
            <option value={platform}>{platform}</option>
          {/each}
          <option value="other">Other (Please specify)</option>
        </select>
      </div>

      {#if showCustomPlatformInput}
        <div class="form-control transition-all duration-300 ease-in-out">
          <label for="custom_platform_source" class="label">
            <span class="label-text">Specify Other Platform</span>
          </label>
          <input
            type="text"
            name="custom_platform_source"
            id="custom_platform_source"
            class="input input-bordered w-full"
            placeholder="e.g., Internal Team Review"
            required={showCustomPlatformInput}
            value={form?.action === "addFeedbackLog" &&
            form?.error &&
            typeof form.formData?.custom_platform_source === "string"
              ? form.formData.custom_platform_source
              : ""}
          />
        </div>
      {/if}

      <div>
        <label for="feedback_received" class="label">
          <span class="label-text">Feedback Received</span>
        </label>
        <textarea
          name="feedback_received"
          id="feedback_received"
          class="textarea textarea-bordered w-full"
          placeholder="Enter the feedback content here..."
          rows="4"
          required
          value={form?.action === "addFeedbackLog" &&
          form?.error &&
          typeof form.formData?.feedback_received === "string"
            ? form.formData.feedback_received
            : ""}
        ></textarea>
      </div>

      <button type="submit" class="btn btn-primary">Save Feedback</button>

      {#if currentFormFeedback?.action === "addFeedbackLog"}
        {#if currentFormFeedback?.success}
          <p class="text-success text-sm mt-2">{currentFormFeedback.message}</p>
        {:else if currentFormFeedback?.error}
          <p class="text-error text-sm mt-2">{currentFormFeedback.error}</p>
        {/if}
      {/if}
    </form>
  </div>

  <!-- Display Logged Feedback -->
  <div>
    <h3 class="text-xl font-semibold mb-4 pt-6 border-t border-base-300">
      Logged Feedback
    </h3>
    {#if feedbackLogs.length > 0}
      <div class="space-y-4">
        {#each feedbackLogs as log (log.id)}
          {@const profile = log.logged_by_user_id
            ? data.profilesMap.get(log.logged_by_user_id)
            : null}
          <div class="card bg-base-100 shadow">
            <div class="card-body p-4">
              <p class="text-xs text-base-content/60">
                Logged by: {profile?.full_name ||
                  profile?.email ||
                  "Unknown User"}
                on {new Date(log.logged_at ?? Date.now()).toLocaleString()}
              </p>
              <h4 class="font-semibold mt-1">
                Item Shared: <span class="font-normal"
                  >{log.shared_item_description}</span
                >
              </h4>
              <p class="text-sm">
                <span class="font-semibold">Source:</span>
                {log.platform_source}
              </p>
              <div class="mt-2 p-3 bg-base-200 rounded-md">
                <p class="text-sm whitespace-pre-wrap">
                  {log.feedback_received}
                </p>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="p-4 bg-base-200 rounded-md text-center">
        <p class="text-base-content/70">
          No feedback has been logged for this project yet.
        </p>
      </div>
    {/if}
  </div>
</section>
