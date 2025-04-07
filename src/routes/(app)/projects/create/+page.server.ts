// src/routes/(app)/projects/create/+page.server.ts
import { error, fail, redirect } from "@sveltejs/kit" // Import fail
import type { PageServerLoad, Actions } from "./$types" // Add Actions type

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
    throw error(400, { message: "No team specified for project creation." })
  }

  // 4. Verify user membership in the specified team AND get team name
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
    .maybeSingle()

  // 5. Handle database errors during verification
  if (membershipError) {
    console.error("Database error checking team membership:", membershipError)
    throw error(500, { message: "Database error verifying team access." })
  }

  // 6. Handle case where user is NOT a member of this team (or team doesn't exist)
  if (!membership || !membership.teams) {
    throw error(403, {
      message: "You do not have permission to create projects for this team.",
    })
  }

  // 7. Success: User is verified, and we have the team name
  const teamName = membership.teams.name

  // 8. Return validated data to the page
  return {
    teamId: teamId,
    teamName: teamName,
  }
}

// Add the actions export
export const actions: Actions = {
  default: async ({ request, locals: { supabase, safeGetSession } }) => {
    // 1. Get user session (required for actions)
    const { session, user } = await safeGetSession()
    if (!session || !user) {
      throw error(401, "Unauthorized")
    }

    // 2. Get form data
    const formData = await request.formData()
    const name = formData.get("projectName") as string // Ensure name="projectName" in your form input
    const description = formData.get("projectDescription") as string // Optional: name="projectDescription"
    const teamId = formData.get("teamId") as string // Ensure you have <input type="hidden" name="teamId" value={data.teamId} /> in your form

    // 3. Basic validation
    if (!name || name.trim().length === 0) {
      return fail(400, {
        name,
        description,
        teamId,
        error: "Project name cannot be empty.",
      })
    }
    if (!teamId) {
      // This shouldn't happen if the hidden input is set correctly from load data
      return fail(400, { name, description, error: "Team ID is missing." })
    }

    // 4. SECURITY CHECK: Re-verify user membership for the submitted teamId
    const { data: membership, error: membershipError } = await supabase
      .from("team_memberships")
      .select("team_id") // Just need to confirm existence
      .eq("user_id", user.id)
      .eq("team_id", teamId)
      .maybeSingle()

    if (membershipError) {
      console.error(
        "Database error re-checking team membership:",
        membershipError,
      )
      return fail(500, { name, description, error: "Database error." })
    }
    if (!membership) {
      // User is trying to submit to a team they aren't part of OR the teamId was tampered with
      console.warn(
        `User ${user.id} attempted to create project in unauthorized team ${teamId}`,
      )
      return fail(403, {
        name,
        description,
        error: "Permission denied for this team.",
      })
    }

    // 5. Insert the project into the database
    const { data: newProject, error: insertError } = await supabase
      .from("projects")
      .insert({
        name: name.trim(),
        owner_team_id: teamId, // Set the validated team
      })
      .select("id") // Select the ID of the newly created project
      .single()

    // 6. Handle insertion errors
    if (insertError) {
      console.error("Error inserting project:", insertError)
      return fail(500, {
        name,
        teamId,
        error: "Failed to create project.",
      })
    }

    // 7. Success: Redirect to the new project's page
    if (newProject?.id) {
      throw redirect(303, `/projects/${newProject.id}`)
    } else {
      // Should not happen if insert succeeded and selected id, but handle defensively
      console.error("Project created but ID not returned.")
      return fail(500, {
        name,
        teamId,
        error: "Project created but failed to redirect.",
      })
    }
  },
}
