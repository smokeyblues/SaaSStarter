// src/routes/(app)/projects/create/+page.server.ts
import { error, redirect } from "@sveltejs/kit" // Import error helper
import type { PageServerLoad } from "./$types"
// Remove Actions import for now, just doing load
// import type { Actions } from './$types';

export const load: PageServerLoad = async ({
  url,
  locals: { supabase, safeGetSession },
}) => {
  // 1. Get session/user (redundant check due to layout, but safe)
  const { session, user } = await safeGetSession()
  if (!session || !user) {
    throw redirect(303, "/login")
  }

  // 2. Get teamId from URL search parameters
  const teamId = url.searchParams.get("teamId")

  // 3. Validate teamId presence
  if (!teamId) {
    console.warn("No teamId provided in URL for project creation.")
    // Throw a client error - Bad Request
    throw error(400, { message: "No team specified for project creation." })
  }

  // 4. Verify user membership in the specified team AND get team name
  // Query team_memberships, filtering by user AND team, and select the nested team name
  const { data: membership, error: membershipError } = await supabase
    .from("team_memberships")
    .select(
      `
            role, 
            teams ( id, name )
        `,
    )
    .eq("user_id", user.id)
    .eq("team_id", teamId)
    .maybeSingle() // Expect 0 or 1 result

  // 5. Handle database errors during verification
  if (membershipError) {
    console.error("Database error checking team membership:", membershipError)
    throw error(500, { message: "Database error verifying team access." })
  }

  // 6. Handle case where user is NOT a member of this team (or team doesn't exist)
  if (!membership || !membership.teams) {
    // Throw a forbidden error - user doesn't have access to this team
    // Or the teamId was invalid/didn't exist
    throw error(403, {
      message: "You do not have permission to create projects for this team.",
    })
  }

  // 7. Success: User is verified, and we have the team name
  const teamName = membership.teams.name

  // 8. Return validated data to the page
  return {
    teamId: teamId, // Pass the validated teamId
    teamName: teamName, // Pass the fetched team name
  }
}

// --- ADD THE ACTIONS EXPORT BELOW ---

export const actions: Actions = {
  // Default action handles the simple form POST
  default: async ({ request, locals: { supabase, safeGetSession } }) => {
    // 1. Get session/user
    const { session, user } = await safeGetSession()
    if (!session || !user) {
      // Should be protected by load, but check again
      throw error(401, { message: "Unauthorized" })
    }

    // 2. Parse form data
    const formData = await request.formData()
    const projectName = formData.get("projectName") as string
    const teamId = formData.get("teamId") as string // Get teamId from hidden input

    // 3. Validate input
    // Basic validation for project name
    if (!projectName || projectName.trim().length === 0) {
      return fail(400, {
        projectName, // Pass back submitted value
        teamId, // Pass back teamId
        missingProject: true,
        message: "Project name cannot be empty.",
      })
    }
    // Validate teamId presence (although it should always be there from hidden input)
    if (!teamId) {
      console.error("teamId missing from form submission unexpectedly.")
      return fail(400, {
        projectName: projectName.trim(),
        error: true, // Use general error flag
        message: "Team association is missing. Please try again.",
      })
    }

    // 4. ***Crucial Security Check***: Re-verify user's membership in the team
    //    Don't trust the teamId from the form alone. RLS *should* prevent this,
    //    but explicit checks are safer (defense-in-depth).
    const { error: membershipError } = await supabase
      .from("team_memberships")
      .select("team_id") // Only need to check for existence
      .eq("user_id", user.id)
      .eq("team_id", teamId)
      .limit(1)
      .single() // Use .single() which errors if no row found (or more than one)

    if (membershipError) {
      // If .single() errors because no row found, it means user is not a member
      // Or if there's another DB error.
      console.error("Permission check failed or DB error:", membershipError)
      return fail(403, {
        // Forbidden
        projectName: projectName.trim(),
        teamId,
        error: true,
        message: "You do not have permission to create projects for this team.",
      })
    }

    // 5. Insert the new project into the database
    const { data: newProject, error: insertError } = await supabase
      .from("projects")
      .insert({
        name: projectName.trim(),
        owner_team_id: teamId, // Use the validated teamId
      })
      .select("id") // Select the ID of the newly created project
      .single() // Expecting one row back

    // 6. Handle database insertion errors
    if (insertError) {
      console.error("Error inserting project into database:", insertError)
      return fail(500, {
        projectName: projectName.trim(),
        teamId,
        error: true,
        message:
          "Failed to create project due to a server issue. Please try again.",
      })
    }

    // 7. Success! Redirect to the new project's page
    if (newProject?.id) {
      throw redirect(303, `/projects/${newProject.id}`)
    } else {
      // Should not happen if insert succeeded without error and we selected id
      console.error("Project created but ID not returned.")
      // Redirect to dashboard as a fallback
      throw redirect(303, "/dashboard")
    }
  },
}
