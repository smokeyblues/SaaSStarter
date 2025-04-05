// src/routes/(app)/+layout.server.ts
import { redirect } from "@sveltejs/kit"
import type { LayoutServerLoad } from "./$types"
import type { TeamMembershipWithTeamDetails } from "$lib/types" // Define this custom type below

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

  // Fetch the teams the user is a member of, including team details
  // Use generated types for safety
  const { data: userTeams, error: teamsError } = await supabase
    .from("team_memberships")
    .select(
      `
            role,
            teams ( id, name, owner_user_id )
        `,
    ) // Select role from team_memberships and related team details
    .eq("user_id", user.id)

  if (teamsError) {
    console.error("Error fetching user's teams:", teamsError)
    // Handle error appropriately - maybe return an empty array or show error state
  }

  return {
    session,
    profile,
    user,
    amr: aal?.currentAuthenticationMethods,
    userTeams: (userTeams ?? []) as TeamMembershipWithTeamDetails[], // Pass the user's teams (or empty array)
  }
}

function _hasFullProfile(profile: any) {
  if (!profile) return false
  if (!profile.full_name) return false
  if (!profile.company_name) return false
  if (!profile.website) return false
  return true
}
