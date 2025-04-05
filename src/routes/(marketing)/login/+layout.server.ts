import type { LayoutServerLoad } from "./$types"
import { redirect } from "@sveltejs/kit"

export const load: LayoutServerLoad = async ({
  locals: { safeGetSession },
  url,
}) => {
  // Check if we have a valid session using the server-side helper
  const { session, user } = await safeGetSession()

  // Only redirect if we have both session and user with valid IDs
  if (session?.user?.id && user?.id) {
    redirect(303, "/dashboard")
  }

  return {
    url: url.origin,
  }
}
