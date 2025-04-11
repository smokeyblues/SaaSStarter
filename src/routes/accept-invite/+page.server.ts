import { error, fail, redirect } from "@sveltejs/kit"
import type { Actions, PageServerLoad } from "./$types"
import type { Tables } from "../../DatabaseDefinitions"
import type { LayoutData as AppLayoutData } from "../(app)/$types"

export const load = async ({
  url,
  locals: { supabase, safeGetSession, supabaseServiceRole },
  parent,
}) => {
  const layoutData = (await parent()) as AppLayoutData

  const token = url.searchParams.get("token")
  const loggedInUserEmail = layoutData.session?.user?.email ?? null
  const defaultErrorMessage = "Invalid or expired invitation link."

  const pageSpecificData = {
    isValidToken: false,
    message: defaultErrorMessage as string | null,
    teamName: null as string | null,
    invitedEmail: null as string | null,
    isLoggedInUserMatch: false,
    accountExistsForEmail: null as boolean | null,
    token: token,
  }

  if (!token) {
    return { ...layoutData, ...pageSpecificData }
  }

  const { data: invite, error: inviteError } = await supabase
    .from("team_invitations")
    .select(`team_id, invited_user_email, role, status, teams ( name )`)
    .eq("token", token)
    .maybeSingle()

  if (inviteError) {
    console.error("Error fetching invitation:", inviteError)
    pageSpecificData.message =
      "An error occurred while validating the invitation."
    return { ...layoutData, ...pageSpecificData }
  }

  if (!invite || !invite.teams) {
    pageSpecificData.message = defaultErrorMessage
    return { ...layoutData, ...pageSpecificData }
  }

  if (invite.status !== "pending") {
    if (invite.status === "accepted") {
      pageSpecificData.message = "This invitation has already been accepted."
    } else if (invite.status === "revoked") {
      pageSpecificData.message = "This invitation has been revoked."
    } else if (invite.status === "expired") {
      pageSpecificData.message = "This invitation has expired."
    } else {
      pageSpecificData.message = defaultErrorMessage
    }
    return { ...layoutData, ...pageSpecificData }
  }

  pageSpecificData.isValidToken = true
  pageSpecificData.message = null
  pageSpecificData.teamName = invite.teams.name
  pageSpecificData.invitedEmail = invite.invited_user_email
  pageSpecificData.isLoggedInUserMatch =
    loggedInUserEmail === invite.invited_user_email

  if (!layoutData.session && pageSpecificData.invitedEmail) {
    try {
      const adminAuthClient = supabaseServiceRole.auth.admin

      const listUsersOptions = {
        page: 1,
        perPage: 1,
        filter: `email == "${pageSpecificData.invitedEmail}"`,
      }

      const { data: listUsersData, error: userCheckError } =
        await adminAuthClient.listUsers(listUsersOptions)

      if (userCheckError) {
        throw userCheckError
      }
      pageSpecificData.accountExistsForEmail =
        (listUsersData?.users?.length ?? 0) > 0
    } catch (err) {
      console.error("Error checking user existence with service role:", err)
      pageSpecificData.message =
        "Could not verify account status. Please try logging in or signing up."
      pageSpecificData.isValidToken = false
      return { ...layoutData, ...pageSpecificData }
    }
  }

  return {
    ...layoutData,
    ...pageSpecificData,
  }
}

export const actions: Actions = {
  acceptInvite: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { session } = await safeGetSession()
    const formData = await request.formData()
    const token = formData.get("token") as string

    if (!session?.user) {
      return fail(401, {
        success: false,
        message: "You must be logged in to accept.",
        token,
      })
    }
    if (!token) {
      return fail(400, {
        success: false,
        message: "Missing invitation token.",
        token,
      })
    }

    const { data: rpcResponseArray, error: rpcError } = await supabase.rpc(
      "accept_team_invitation",
      {
        invitation_token: token,
        accepting_user_id: session.user.id,
      },
    )

    if (rpcError) {
      console.error("RPC error accept_team_invitation:", rpcError)
      return fail(500, {
        success: false,
        message: "An unexpected error occurred.",
        token,
      })
    }

    const resultData = rpcResponseArray?.[0]

    if (!resultData?.success) {
      return fail(400, {
        success: false,
        message: resultData?.message || "Failed to accept invitation.",
        token,
      })
    }

    if (resultData.team_id) {
      redirect(303, `/teams/${resultData.team_id}`)
    } else {
      console.warn(
        "accept_team_invitation succeeded but did not return team_id",
      )
      redirect(303, "/dashboard")
    }
  },
}
