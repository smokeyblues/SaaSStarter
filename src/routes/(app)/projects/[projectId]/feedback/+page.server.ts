// src/routes/(app)/projects/[projectId]/feedback/+page.server.ts
import { error, fail, redirect } from "@sveltejs/kit"
import type { Actions, PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({
  locals: { supabase, user },
  params,
}) => {
  if (!user) {
    redirect(303, "/login")
  }
  if (!params.projectId) {
    error(404, "Project not found")
  }

  // Fetch feedback logs
  const { data: feedbackLogsData, error: feedbackLogsError } = await supabase
    .from("project_feedback_log")
    .select(
      `
            id,
            shared_item_description,
            platform_source,
            feedback_received,
            logged_at,
            logged_by_user_id 
            `, // Select logged_by_user_id to fetch profile separately
    )
    .eq("project_id", params.projectId)
    .order("logged_at", { ascending: false })

  if (feedbackLogsError) {
    console.error("Error loading feedback logs:", feedbackLogsError.message)
    return {
      feedbackLogs: [],
      profilesMap: new Map(), // Provide an empty map on error
      projectId: params.projectId,
    }
  }

  const logs = feedbackLogsData ?? []
  const userIds = [
    ...new Set(
      logs.map((log) => log.logged_by_user_id).filter(Boolean) as string[],
    ),
  ] // Get unique, non-null user IDs

  let profilesMap = new Map<
    string,
    { full_name: string | null; email: string | null }
  >()

  if (userIds.length > 0) {
    // Fetch profiles for the collected user IDs
    // IMPORTANT: This relies on RLS on 'profiles' allowing reads.
    // If RLS is strict ("users can only see their own profile"), this will only fetch
    // the current user's profile if they happened to log feedback.
    // Consider a SECURITY DEFINER function to fetch public profile info if needed.
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds)

    if (profilesError) {
      console.error(
        "Error fetching profiles for feedback logs:",
        profilesError.message,
      )
      // Continue without profile data if this fails, but log it
    } else if (profilesData) {
      profilesData.forEach((profile) => {
        profilesMap.set(profile.id, {
          full_name: profile.full_name,
          email: profile.email,
        })
      })
    }
  }

  return {
    feedbackLogs: logs,
    profilesMap: profilesMap, // Pass the map to the page
    projectId: params.projectId,
  }
}

export const actions: Actions = {
  addFeedbackLog: async ({ request, locals: { supabase, user }, params }) => {
    const actionName = "addFeedbackLog"
    const formDataEntries = Object.fromEntries(await request.formData()) // Get all form data

    if (!user)
      return fail(401, {
        action: actionName,
        error: "Unauthorized",
        formData: formDataEntries,
      })
    if (!params.projectId)
      return fail(400, {
        action: actionName,
        error: "Project ID missing",
        formData: formDataEntries,
      })

    const shared_item_description = formDataEntries.shared_item_description
      ?.toString()
      ?.trim()
    const platform_source = formDataEntries.platform_source?.toString()?.trim()
    const custom_platform_source = formDataEntries.custom_platform_source
      ?.toString()
      ?.trim()
    const feedback_received = formDataEntries.feedback_received
      ?.toString()
      ?.trim()

    const final_platform_source =
      platform_source === "other" && custom_platform_source
        ? custom_platform_source
        : platform_source

    if (!shared_item_description) {
      return fail(400, {
        action: actionName,
        error: "Shared item description cannot be empty.",
        formData: formDataEntries,
      })
    }
    if (!final_platform_source) {
      return fail(400, {
        action: actionName,
        error: "Platform/Source cannot be empty.",
        formData: formDataEntries,
      })
    }
    if (!feedback_received) {
      return fail(400, {
        action: actionName,
        error: "Feedback received cannot be empty.",
        formData: formDataEntries,
      })
    }

    const { error: insertError } = await supabase
      .from("project_feedback_log")
      .insert({
        project_id: params.projectId,
        logged_by_user_id: user.id,
        shared_item_description: shared_item_description,
        platform_source: final_platform_source,
        feedback_received: feedback_received,
      })

    if (insertError) {
      console.error("Error adding feedback log:", insertError)
      return fail(500, {
        action: actionName,
        error: `Database error: ${insertError.message}`,
        formData: formDataEntries,
      })
    }

    // On success, don't send back formData as it's not needed for repopulation
    return {
      success: true,
      action: actionName,
      message: "Feedback log added successfully.",
    }
  },
}
