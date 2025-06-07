import type { LayoutServerLoad } from "./$types";
import { redirect } from "@sveltejs/kit";

export const load: LayoutServerLoad = async ({ url, parent }) => { // Add parent, remove safeGetSession from locals
  const parentData = await parent(); // Get data from root layout (session, user, supabase)

  // Redirect if user is already logged in, using data from parent
  // Make sure to handle cases where parentData.session or parentData.user might be null/undefined
  if (parentData.session?.user?.id && parentData.user?.id) {
    redirect(303, "/dashboard");
  }

  return {
    // Explicitly pass only serializable data from parentData
    session: parentData.session,
    user: parentData.user,
    url: url.origin,
  };
};
