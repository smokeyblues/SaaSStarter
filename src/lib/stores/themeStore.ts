import { writable } from "svelte/store"
import { browser } from "$app/environment"

type Theme = "nanowritlabs" | "nanowritlabs-dark"

// Helper function to get the initial theme
function getInitialTheme(): Theme {
  if (!browser) {
    return "nanowritlabs" // Default theme for SSR
  }
  const storedTheme = localStorage.getItem("theme") as Theme | null
  if (storedTheme) {
    return storedTheme
  }
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
  return prefersDark ? "nanowritlabs-dark" : "nanowritlabs"
}

// Create the writable store
const initialTheme = getInitialTheme()
export const theme = writable<Theme>(initialTheme)

// Function to toggle the theme
export function toggleTheme() {
  theme.update((currentTheme) => {
    const newTheme =
      currentTheme === "nanowritlabs" ? "nanowritlabs-dark" : "nanowritlabs"
    if (browser) {
      localStorage.setItem("theme", newTheme) // Update localStorage
    }
    return newTheme
  })
}

// Update the data-theme attribute whenever the theme store changes
if (browser) {
  theme.subscribe(($theme) => {
    document.documentElement.setAttribute("data-theme", $theme)
  })
  // Ensure initial theme is set on load
  document.documentElement.setAttribute("data-theme", initialTheme)
}
