import { error, fail, redirect } from "@sveltejs/kit"
import type { Actions, PageServerLoad } from "./$types"

export const load = (async ({ locals: { supabase, session }, params }) => {
  const { teamId } = params

  // Fetch team details
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select(`id, name, owner_user_id`)
    .eq("id", teamId)
    .single()

  if (teamError || !team) {
    console.error("Error fetching team:", teamError)
    error(404, "Team not found")
  }

  // Fetch team members and their profiles
  const { data: members, error: membersError } = await supabase
    .from("team_memberships")
    .select(
      `
      role,
      user_id,
      profiles (
        full_name,
        avatar_url
      )
    `,
    )
    .eq("team_id", teamId)

  if (membersError) {
    console.error("Error fetching team members:", membersError)
    // Don't throw a fatal error, maybe just log or return empty array
    // error(500, 'Failed to load team members');
  }

  // Fetch team projects
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select(`id, name`)
    .eq("owner_team_id", teamId)

  if (projectsError) {
    console.error("Error fetching team projects:", projectsError)
    // Don't throw a fatal error
    // error(500, 'Failed to load team projects');
  }

  // const session = await safeGetSession()

  return {
    team,
    members: members ?? [],
    projects: projects ?? [],
    isOwner: team?.owner_user_id === session?.user?.id,
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

    const actionData = { action: "updateName", currentName: newName }

    if (!user) {
      return fail(401, { ...actionData, error: "Unauthorized" })
    }

    if (
      !newName ||
      typeof newName !== "string" ||
      newName.trim().length === 0
    ) {
      return fail(400, {
        ...actionData,
        error: "Team name cannot be empty",
      })
    }

    // Verify user is the owner before allowing update
    const { data: teamData, error: fetchError } = await supabase
      .from("teams")
      .select("owner_user_id")
      .eq("id", teamId)
      .single()

    if (fetchError || !teamData) {
      return fail(404, { action: "updateName", error: "Team not found" })
    }

    if (teamData.owner_user_id !== user.id) {
      return fail(403, {
        action: "updateName",
        error: "Only the team owner can rename the team",
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
      })
    }

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
}
