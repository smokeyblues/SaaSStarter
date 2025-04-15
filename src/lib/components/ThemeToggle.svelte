<script lang="ts">
  import Sun from "lucide-svelte/icons/sun" // Ensure lucide-svelte is installed
  import Moon from "lucide-svelte/icons/moon"
  import { theme, toggleTheme } from "$lib/stores/themeStore"

  // Local state for the checkbox, initialized from the store
  let isChecked = $state($theme === "nanowritlabs-dark")

  // Update local state when store changes (e.g., initial load, another tab)
  $effect(() => {
    isChecked = $theme === "nanowritlabs-dark"
  })

  // Update the store when the checkbox is changed by the user
  function handleChange() {
    toggleTheme()
    // The $effect above will update isChecked after the store changes
  }
</script>

<label class="swap swap-rotate btn btn-ghost btn-circle">
  <!-- this hidden checkbox controls the state -->
  <input
    type="checkbox"
    bind:checked={isChecked}
    onchange={handleChange}
    aria-label="Toggle theme"
  />

  <!-- sun icon (shown when light) -->
  <Sun class="swap-off h-6 w-6 fill-current" />

  <!-- moon icon (shown when dark) -->
  <Moon class="swap-on h-6 w-6 fill-current" />
</label>
