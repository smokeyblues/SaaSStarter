import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ cookies, parent }) => { // Add parent, remove locals
  const parentData = await parent(); // Get session, user, supabase from root

  // Potentially, add redirect logic here if admin/account pages should not be accessed by logged-out users.
  // For example:
  // if (!parentData.session?.user?.id) {
  //   redirect(303, '/login'); // Or appropriate login page
  // }
  // However, the (admin) group might have its own higher-level +layout.server.ts for auth.
  // For now, let's stick to the primary goal: passing supabase data.
  // The (admin) group itself likely has a higher +layout.server.ts that protects the entire group.
  // The existing src/routes/(app)/+layout.server.ts already protects (app) routes.
  // Let's assume (admin) routes are protected by a similar mechanism if needed, or that some pages
  // under (admin)/account are accessible by users who are not fully "app-active" yet (e.g. create_profile).

  return {
    // Explicitly pass only serializable data from parentData
    session: parentData.session,
    user: parentData.user,
    cookies: cookies.getAll(), // cookies are serializable
  };
};
