// src/routes/(app)/teams/create/+page.server.ts

import { fail, redirect } from "@sveltejs/kit"
import type { Actions } from "./$types" // Make sure $types are generated/updated

export const actions: Actions = {
  // 'default' handles POST requests without a specific action name attribute on the button/form
  default: async ({ request, locals: { supabase, safeGetSession } }) => {
    // 1. Get session/user
    const { session, user } = await safeGetSession()
    if (!session || !user) {
      // This should ideally not happen if the user got to this page,
      // but good practice to check. Redirect to login.
      throw redirect(303, "/login")
    }

    // 2. Parse form data
    const formData = await request.formData()
    const teamName = formData.get("teamName") as string // Cast expected type

    // 3. Validate input
    if (!teamName || teamName.trim().length === 0) {
      // Return validation error using fail()
      // This data gets passed back to the +page.svelte 'form' prop
      return fail(400, {
        teamName: teamName, // Pass back the invalid value
        missing: true, // Flag the specific error
        message: "Team name cannot be empty.", // User-friendly message
      })
    }

    // --- Optional: Add more validation (length, characters, uniqueness if needed) ---

    // 4. Perform the database insertion
    const { data, error } = await supabase
      .from("teams")
      .insert({
        name: teamName.trim(), // Trim whitespace
        owner_user_id: user.id, // Set the logged-in user as the owner
      })
      .select("id") // Optionally select the ID if needed immediately
      .single()

    // 5. Handle potential database errors
    if (error) {
      console.error("Error creating team in database:", error)
      // Return a generic server error
      return fail(500, {
        teamName: teamName.trim(), // Pass back the value
        error: true, // Flag a general error
        message:
          "Failed to create team due to a server issue. Please try again.",
      })
      // Note: The trigger `on_team_created` should automatically add the owner
      // to the team_memberships table after this insert succeeds.
    }

    // 6. Redirect on success
    // Redirect back to the dashboard after successful creation
    // Use 303 See Other for POST->GET redirect
    throw redirect(303, "/dashboard")
  },
} // Make sure the closing brace for the 'actions' object is present

// Optional: Add a load function if this page needs data on initial GET request
// import type { PageServerLoad } from './$types';
// export const load: PageServerLoad = async ({ locals }) => {
//     // Check auth etc. if needed, though layout load might handle this
// };
