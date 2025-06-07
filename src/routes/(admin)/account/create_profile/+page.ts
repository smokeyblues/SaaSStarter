import { _hasFullProfile } from "../+layout"
import { redirect } from "@sveltejs/kit"

export async function load({ parent }) {
  const parentData = await parent()

  // They completed their profile! Redirect to "Select a Plan" screen.
  if (_hasFullProfile(parentData?.profile)) {
    redirect(303, "/account/select_plan")
  }

  return {
    data: {
      user: parentData.user,
      profile: parentData.profile,
    },
    form: {
      fullName: parentData.profile?.full_name ?? "",
      companyName: parentData.profile?.company_name ?? "",
      website: parentData.profile?.website ?? "",
    },
  }
}
