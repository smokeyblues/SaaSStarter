import { error, fail, redirect } from "@sveltejs/kit"
import type { Actions, PageServerLoad } from "./$types"
// Import Tables type if needed for stricter typing below
import type { Tables } from "../../../../DatabaseDefinitions" // Adjust path as needed

// Define a type for the combined member+profile structure
type TeamMemberWithProfile = Tables<"team_memberships"> & {
  profiles: Pick<Tables<"profiles">, "full_name" | "avatar_url"> | null
}

// Define valid assignable roles (excluding owner)
const VALID_ROLES = ["member", "admin"] as const // Use 'as const' for literal types
type AssignableRole = (typeof VALID_ROLES)[number]

export const load = (async ({
  locals: { supabase, supabaseServiceRole, session },
  params,
}) => {
  const { teamId } = params
  const userId = session?.user?.id

  // 1. Fetch team details
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select(`id, name, owner_user_id`)
    .eq("id", teamId)
    .single()

  if (teamError) {
    console.error("Error fetching team:", teamError)
    error(500, `Failed to load team details: ${teamError.message}`)
  }
  if (!team) {
    error(404, "Team not found")
  }

  // 2. Fetch basic team memberships
  const { data: memberships, error: membersError } = await supabase
    .from("team_memberships")
    .select(`role, user_id, team_id, created_at`)
    .eq("team_id", teamId)

  if (membersError) {
    console.error("Error fetching team members:", membersError)
    // Proceed, members might be empty or partially loaded if needed
  }

  // 3. Fetch profiles and combine
  let membersWithProfiles: TeamMemberWithProfile[] = []
  if (memberships && memberships.length > 0) {
    const memberUserIds = memberships.map((m) => m.user_id)
    const { data: profilesData, error: profilesError } =
      await supabaseServiceRole
        .from("profiles")
        .select(`id, full_name, avatar_url`)
        .in("id", memberUserIds)

    if (profilesError) {
      console.error(
        "Error fetching member profiles (using Service Role):",
        profilesError,
      )
      membersWithProfiles = memberships.map((m) => ({ ...m, profiles: null }))
    } else {
      const profilesMap = new Map(
        profilesData.map((p) => [
          p.id,
          { full_name: p.full_name, avatar_url: p.avatar_url },
        ]),
      )
      membersWithProfiles = memberships.map((m) => ({
        ...m,
        profiles: profilesMap.get(m.user_id) ?? null,
      }))
    }
  }

  // 4. Fetch team projects
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select(`id, name`)
    .eq("owner_team_id", teamId)

  if (projectsError) {
    console.error("Error fetching team projects:", projectsError)
  }

  return {
    team, // Note: TS might still warn about null here, but load throws if !team
    members: membersWithProfiles,
    projects: projects ?? [],
    isOwner: team?.owner_user_id === userId, // Check required here
  }
}) satisfies PageServerLoad

export const actions: Actions = {
  updateTeamName: async ({
    request,
    locals: { supabase, session },
    params,
  }) => {
    const formData = await request.formData()
    const newName = formData.get("teamName") as string
    const { teamId } = params
    const user = session?.user

    // Return the name field consistently on validation errors for this action
    const actionData = { action: "updateName", currentName: newName || null }

    if (!user) {
      return fail(401, {
        ...actionData,
        error: "Unauthorized",
        currentName: undefined,
      }) // Don't expose name on auth fail
    }

    if (
      !newName ||
      typeof newName !== "string" ||
      newName.trim().length === 0
    ) {
      return fail(400, {
        ...actionData, // Includes currentName
        error: "Team name cannot be empty",
      })
    }

    // Verify user is the owner before allowing update
    const { data: teamData, error: fetchError } = await supabase
      .from("teams")
      .select("owner_user_id")
      .eq("id", teamId)
      .single()

    // Reset currentName if the error is not about the name itself
    if (fetchError || !teamData) {
      console.error("Error fetching team for update check:", fetchError)
      return fail(404, {
        action: "updateName",
        error: "Team not found",
        currentName: undefined,
      })
    }

    if (teamData.owner_user_id !== user.id) {
      return fail(403, {
        action: "updateName",
        error: "Only the team owner can rename the team",
        currentName: undefined, // Reset currentName
      })
    }

    // Update the team name
    const { error: updateError } = await supabase
      .from("teams")
      .update({ name: newName.trim() })
      .eq("id", teamId)

    if (updateError) {
      console.error("Error updating team name:", updateError)
      return fail(500, {
        action: "updateName",
        error: "Failed to update team name",
        currentName: newName, // Keep name on server error for retry
      })
    }

    // Success case does not need currentName
    return {
      action: "updateName",
      success: true,
      message: "Team name updated successfully.",
    }
  },

  deleteTeam: async ({ locals: { supabase, session }, params }) => {
    const { teamId } = params
    const user = session?.user
    const actionData = { action: "deleteTeam" }

    if (!user) {
      return fail(401, { ...actionData, error: "Unauthorized" })
    }

    // Verify user is the owner before allowing delete
    const { data: teamData, error: fetchError } = await supabase
      .from("teams")
      .select("owner_user_id")
      .eq("id", teamId)
      .single()

    if (fetchError) {
      console.error("Error fetching team for deletion check:", fetchError)
      return fail(500, {
        ...actionData,
        error: "Could not verify team ownership.",
      })
    }
    if (!teamData) {
      return fail(404, { ...actionData, error: "Team not found" })
    }
    if (teamData.owner_user_id !== user.id) {
      return fail(403, {
        ...actionData,
        error: "Only the team owner can delete the team",
      })
    }

    // --- Deletion Logic ---
    // Note: This assumes related data (memberships, projects?) might be handled by `ON DELETE CASCADE`
    // or needs to be manually cleaned up first if deletion fails due to constraints.

    // 1. Delete memberships first (if not using ON DELETE CASCADE)
    // const { error: memberDeleteError } = await supabase
    //    .from('team_memberships')
    //    .delete()
    //    .eq('team_id', teamId);
    // if (memberDeleteError) {
    //    console.error("Error deleting team members:", memberDeleteError);
    //    return fail(500, {...actionData, error: 'Failed to remove team members before deleting team.'});
    // }

    // 2. (Optional) Handle projects - e.g., reassign or delete them.
    //    If projects have a foreign key to teams with ON DELETE RESTRICT, this delete will fail
    //    if projects still exist.

    // 3. Delete the team itself
    const { error: deleteError } = await supabase
      .from("teams")
      .delete()
      .eq("id", teamId)

    if (deleteError) {
      console.error("Error deleting team:", deleteError)
      // Provide a more specific message if it's a foreign key violation
      if (deleteError.code === "23503") {
        return fail(409, {
          ...actionData,
          error:
            "Cannot delete team. Ensure all associated projects are removed or reassigned first.",
        })
      }
      return fail(500, { ...actionData, error: "Failed to delete team." })
    }

    // Redirect to a safe page after deletion
    redirect(303, "/dashboard")
  },

  removeMember: async ({ request, locals: { supabase, session }, params }) => {
    const { teamId } = params
    const user = session?.user
    const formData = await request.formData()
    const memberUserId = formData.get("memberUserId") as string

    // Base action data for returns
    const baseActionData = { action: "removeMember" as const }

    // 1. Authentication & Basic Validation
    if (!user) {
      return fail(401, { ...baseActionData, error: "Unauthorized" })
    }
    if (!memberUserId) {
      // Add failedUserId: null for consistency if needed by client checks, otherwise omit
      return fail(400, { ...baseActionData, error: "Member User ID missing." })
    }

    // Action data specific to this potential failure point
    const actionDataWithError = {
      ...baseActionData,
      failedUserId: memberUserId,
    }

    // 2. Authorization: Verify caller is the team owner
    //    (RLS also enforces this, but belt-and-suspenders is good)
    const { data: teamData, error: teamFetchError } = await supabase
      .from("teams")
      .select("owner_user_id")
      .eq("id", teamId)
      .single()

    if (teamFetchError || !teamData) {
      console.error(
        "Error fetching team for remove member check:",
        teamFetchError,
      )
      // Omit failedUserId here as it's not specific to a user interaction failure
      return fail(404, {
        ...baseActionData,
        error: "Team not found or could not verify ownership.",
      })
    }

    if (teamData.owner_user_id !== user.id) {
      return fail(403, {
        ...actionDataWithError,
        error: "Only the team owner can remove members.",
      })
    }

    // 3. Prevent owner from removing themselves (RLS also prevents this)
    if (memberUserId === user.id || memberUserId === teamData.owner_user_id) {
      return fail(400, {
        ...actionDataWithError,
        error: "Team owner cannot be removed.",
      })
    }

    // 4. Database Operation: Delete the membership
    const { error: deleteError } = await supabase
      .from("team_memberships")
      .delete()
      .match({ team_id: teamId, user_id: memberUserId })

    if (deleteError) {
      console.error("Error removing team member:", deleteError)
      return fail(500, {
        ...actionDataWithError,
        error: "Failed to remove member.",
      })
    }

    // 5. Success: No specific data needed, enhance callback will invalidate
    //    Returning a success object is good practice though.
    return { ...baseActionData, success: true, removedUserId: memberUserId }
    // SvelteKit forms + enhance + invalidateAll will handle the UI update.
  },

  // --- NEW: changeMemberRole action ---
  changeMemberRole: async ({
    request,
    locals: { supabase, session },
    params,
  }) => {
    const { teamId } = params
    const user = session?.user
    const formData = await request.formData()
    const memberUserId = formData.get("memberUserId") as string
    const newRole = formData.get("newRole") as string

    // Base action data for returns
    const baseActionData = { action: "changeMemberRole" as const }

    // 1. Authentication & Basic Validation
    if (!user) {
      return fail(401, { ...baseActionData, error: "Unauthorized" })
    }
    if (!memberUserId || !newRole) {
      return fail(400, {
        ...baseActionData,
        error: "Missing member ID or new role.",
      })
    }

    // Action data with user context for errors
    const actionDataWithError = {
      ...baseActionData,
      failedUserId: memberUserId,
    }

    // 2. Validate the submitted role
    if (!VALID_ROLES.includes(newRole as AssignableRole)) {
      return fail(400, {
        ...actionDataWithError,
        error: `Invalid role specified. Must be one of: ${VALID_ROLES.join(", ")}`,
      })
    }

    // 3. Authorization: Verify caller is the team owner
    const { data: teamData, error: teamFetchError } = await supabase
      .from("teams")
      .select("owner_user_id")
      .eq("id", teamId)
      .single()

    if (teamFetchError || !teamData) {
      console.error(
        "Error fetching team for role change check:",
        teamFetchError,
      )
      // General error, not specific to the user being edited
      return fail(404, {
        ...baseActionData,
        error: "Team not found or could not verify ownership.",
      })
    }

    if (teamData.owner_user_id !== user.id) {
      return fail(403, {
        ...actionDataWithError,
        error: "Only the team owner can change roles.",
      })
    }

    // 4. Prevent changing the owner's role (RLS also handles this, but good check)
    if (memberUserId === teamData.owner_user_id) {
      return fail(400, {
        ...actionDataWithError,
        error: "The team owner's role cannot be changed here.",
      })
    }

    // 5. Database Operation: Update the role
    const { error: updateError } = await supabase
      .from("team_memberships")
      .update({ role: newRole }) // Update the role column
      .match({ team_id: teamId, user_id: memberUserId }) // Match the specific membership

    if (updateError) {
      console.error("Error changing member role:", updateError)
      // Check if it was because the user wasn't found (though unlikely if listed)
      if (updateError.code === "PGRST204") {
        // PostgREST code for no rows updated/found
        return fail(404, {
          ...actionDataWithError,
          error: "Member not found in this team.",
        })
      }
      return fail(500, {
        ...actionDataWithError,
        error: "Failed to update member role.",
      })
    }

    // 6. Success
    return {
      ...baseActionData,
      success: true,
      updatedUserId: memberUserId,
      updatedRole: newRole,
    }
  },
}
