// src/routes/(app)/+layout.server.ts
import { redirect } from "@sveltejs/kit"
import type { LayoutServerLoad } from "./$types"
import type { TeamMembershipWithTeamDetails } from "$lib/types" // Define this custom type below
import { CreateProfileStep } from "../../config"

// Optional: Define a more specific type combining membership and team details
// You might put this in a shared types file (e.g., src/lib/types.ts)
// Ensure the select query below matches this structure
// type TeamMembershipWithTeamDetails = {
//   role: string
//   teams: {
//     // Corresponds to the joined 'teams' table
//     id: string
//     name: string
//     owner_user_id: string | null
//   } | null // Use null if the join might result in no team match (shouldn't happen with INNER JOIN default)
// }

export const load: LayoutServerLoad = async ({
  locals: { safeGetSession, supabase },
  url,
}) => {
  // Check if we have a valid session using the server-side helper
  const { session, user } = await safeGetSession()

  // Redirect to login if no valid session
  if (!session?.user?.id || !user?.id) {
    redirect(303, "/login")
  }

  // Fetch additional user data
  const { data: profile } = await supabase
    .from("profiles")
    .select(`*`)
    .eq("id", user.id)
    .single()

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

  // Profile redirect check
  const createProfilePath = "/account/create_profile"
  const signOutPath = "/account/sign_out"
  if (
    profile &&
    !_hasFullProfile(profile) &&
    url.pathname !== createProfilePath &&
    url.pathname !== signOutPath &&
    CreateProfileStep
  ) {
    redirect(303, createProfilePath)
  }

  // Fetch the teams the user is a member of using the RPC function
  const { data: userTeamsData, error: rpcError } = await supabase.rpc(
    "get_user_teams_with_details",
  ) // Call the function

  if (rpcError) {
    console.error("Error fetching user's teams via RPC:", rpcError)
    // Handle error appropriately
  }

  // Structure the data to match the expected 'TeamMembershipWithTeamDetails' type
  // The function returns rows like { role, team_id, team_name, team_owner_user_id }
  const userTeams =
    userTeamsData?.map((row) => ({
      role: row.role,
      teams: {
        // Nest the team details
        id: row.team_id,
        name: row.team_name,
        owner_user_id: row.team_owner_user_id,
      },
    })) ?? []

  return {
    session,
    profile,
    user,
    amr: aal?.currentAuthenticationMethods,
    // Ensure the final structure matches 'TeamMembershipWithTeamDetails[]'
    userTeams: userTeams as TeamMembershipWithTeamDetails[],
  }
}

function _hasFullProfile(profile: any) {
  if (!profile) return false
  if (!profile.full_name) return false
  if (!profile.company_name) return false
  if (!profile.website) return false
  return true
}
