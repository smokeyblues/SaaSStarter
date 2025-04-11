import { redirect, error, fail } from "@sveltejs/kit"
import type { PageServerLoad, Actions } from "./$types"
import type { Tables, TablesInsert, Json } from "../../../DatabaseDefinitions"

// Type only includes direct invitation columns
type PendingUserInvitation = Pick<
  Tables<"team_invitations">,
  "id" | "role" | "created_at" | "token" | "team_id" // Keep team_id just in case, but no 'teams' object
>

// Define a simple type for the project data needed
type DashboardProject = Pick<
  Tables<"projects">,
  "id" | "name" | "owner_team_id"
>

export const load = (async ({ locals: { supabase, session }, parent }) => {
  if (!session?.user) {
    redirect(303, "/login")
  }
  // Ensure parent data (including userTeams, profile) is loaded
  const parentData = await parent()
  const userEmail = session.user.email
  if (!userEmail) {
    console.error("User session found but email is missing.")
    error(500, "User email not found in session.")
  }

  // --- Fetch Pending Invitations for the current user (NO JOIN) ---
  const { data: pendingInvitations, error: invitationsError } = await supabase
    .from("team_invitations")
    .select(
      `
            id,
            role,
            created_at,
            token,
            team_id
        `, // Ensure 'teams ( id, name )' is NOT here
    )
    .eq("invited_user_email", userEmail)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  if (invitationsError) {
    // Log potential errors - hopefully no recursion here now
    console.error(
      "Error fetching basic pending invitations for user:", // Changed log message
      invitationsError,
    )
  }

  // --- Fetch User's Projects based on Team Memberships ---
  let userProjects: DashboardProject[] = []
  // Extract team IDs from the layout data (parentData)
  const userTeamIds =
    (parentData.userTeams
      ?.map((membership) => membership.teams?.id)
      .filter((id) => !!id) as string[]) ?? []

  if (userTeamIds.length > 0) {
    const { data: projectsData, error: projectsError } = await supabase
      .from("projects")
      .select("id, name, owner_team_id") // Select needed fields
      .in("owner_team_id", userTeamIds) // Filter by teams user is in
      .order("name", { ascending: true }) // Optional ordering

    if (projectsError) {
      console.error("Error fetching user projects:", projectsError)
      // Decide how to handle: return empty array or throw error?
      // For dashboard, probably best to show empty list on error
    } else {
      userProjects = projectsData ?? []
    }
  }
  // --- End Fetch User's Projects ---

  return {
    // Ensure the type cast matches the simplified PendingUserInvitation
    pendingInvitations: (pendingInvitations as PendingUserInvitation[]) ?? [],
    projects: userProjects,
  }
}) satisfies PageServerLoad

// --- Actions for Invite Management ---
export const actions: Actions = {
  acceptInvite: async ({ request, locals: { supabase, session } }) => {
    const user = session?.user
    const formData = await request.formData()
    const token = formData.get("token") as string
    const baseActionData = { action: "acceptInvite", token: token }

    if (!user) {
      return fail(401, { ...baseActionData, error: "Unauthorized" })
    }
    if (!token) {
      return fail(400, {
        ...baseActionData,
        error: "Missing invitation token.",
      })
    }

    // Call the NEW function signature
    const { data: rpcResponseArray, error: rpcError } = await supabase.rpc(
      "accept_team_invitation",
      {
        invitation_token: token,
        accepting_user_id: user.id,
      },
    )

    // Extract the single result object from the array (since new func RETURNS TABLE)
    const resultData = rpcResponseArray?.[0]

    if (rpcError) {
      console.error("Error calling accept_team_invitation RPC:", rpcError)
      // Keep error message parsing if desired, but check resultData first
      let errorMessage = "Failed to accept the invitation."
      // You might want to simplify this now that the RPC returns structured errors
      if (rpcError.message.includes("permission to join")) {
        errorMessage = "You do not have permission to join this team."
      }
      // Handle unexpected database/connection errors
      return fail(500, { ...baseActionData, error: errorMessage })
    }

    // Check the actual structured data returned by the function
    if (!resultData?.success) {
      // Use the specific message from the RPC function
      return fail(400, {
        ...baseActionData,
        error: resultData?.message || "Could not accept invitation.", // Message from RPC
      })
    }

    // Success case
    const successMessage = resultData?.message || "Invitation accepted!"
    // Note: We don't redirect here, the dashboard just needs to update UI
    // invalidateAll() in the +page.svelte $effect handles refreshing
    return { ...baseActionData, success: true, message: successMessage }
  },

  declineInvite: async ({ request, locals: { supabase, session } }) => {
    const user = session?.user
    const userEmail = user?.email
    const formData = await request.formData()
    const token = formData.get("token") as string

    const baseActionData = { action: "declineInvite", token: token }

    // 1. Validation: Basic checks
    if (!user || !userEmail) {
      return fail(401, { ...baseActionData, error: "Unauthorized" })
    }
    if (!token) {
      return fail(400, {
        ...baseActionData,
        error: "Missing invitation token.",
      })
    }

    // 2. Validation: Fetch the invitation by token
    const { data: invite, error: fetchError } = await supabase
      .from("team_invitations")
      .select("id, invited_user_email, status") // Need less info than accept
      .eq("token", token)
      .single()

    if (fetchError || !invite) {
      console.error("Error fetching invite by token:", fetchError)
      return fail(404, {
        ...baseActionData,
        error: "Invitation not found or token is invalid.",
      })
    }

    // 3. Validation: Check ownership and status
    if (invite.invited_user_email !== userEmail) {
      return fail(403, {
        ...baseActionData,
        error: "This invitation is for a different user.",
      })
    }
    if (invite.status !== "pending") {
      // If already declined or accepted, just return success to avoid user confusion
      return {
        ...baseActionData,
        success: true,
        message: `Invitation already ${invite.status}.`,
      }
      // Or: fail(400, { ...baseActionData, error: `Invitation is already ${invite.status}.` });
    }

    // 4. Logic: Update invitation status to 'declined'
    const { error: updateError } = await supabase
      .from("team_invitations")
      .update({ status: "declined" })
      .eq("id", invite.id) // Use ID for update

    if (updateError) {
      console.error("Error declining invitation:", updateError)
      return fail(500, {
        ...baseActionData,
        error: "Failed to decline the invitation.",
      })
    }

    // 5. Success
    return {
      ...baseActionData,
      success: true,
      message: "Invitation declined.",
    }
  },
}
