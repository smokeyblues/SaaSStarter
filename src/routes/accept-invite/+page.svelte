<script lang="ts">
  import type { PageData, ActionData } from "./$types"
  import { enhance } from "$app/forms"

  export let data: PageData
  export let form: ActionData | null = null

  $: ({
    isValidToken,
    message,
    teamName,
    invitedEmail,
    isLoggedInUserMatch,
    accountExistsForEmail,
    token,
  } = data)

  $: loggedInUserEmail = data.session?.user?.email

  // Construct login/signup URLs, passing the token
  $: loginUrl = `/login?inviteToken=${encodeURIComponent(token ?? "")}`
  $: signupUrl = `/signup?inviteToken=${encodeURIComponent(token ?? "")}`
  $: acceptInviteUrl = `/accept-invite?token=${encodeURIComponent(token ?? "")}` // For redirect after auth
  $: loginUrlWithRedirect = `/login?redirectTo=${encodeURIComponent(acceptInviteUrl)}`
  $: signupUrlWithRedirect = `/signup?email=${encodeURIComponent(invitedEmail ?? "")}&redirectTo=${encodeURIComponent(acceptInviteUrl)}`
</script>

<div class="container mx-auto p-8 max-w-md">
  <h1 class="text-2xl font-semibold mb-6 text-center">Accept Invitation</h1>

  {#if !isValidToken}
    <!-- Invalid Token or Error during Load -->
    <div class="alert alert-error shadow-lg">
      <div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="stroke-current flex-shrink-0 h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 14l2-2m0 0l2-2m-2 2l-2 2m2-2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          /></svg
        >
        <span
          >{message || "This invitation link is invalid or has expired."}</span
        >
      </div>
    </div>
    <div class="text-center mt-4">
      <a href="/dashboard" class="link link-primary">Go to Dashboard</a>
    </div>
  {:else if loggedInUserEmail}
    <!-- User is Logged In -->
    {#if isLoggedInUserMatch}
      <!-- Logged In User MATCHES Invited Email -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">Join {teamName}?</h2>
          <p>
            You ({loggedInUserEmail}) have been invited to join the team:
            <strong>{teamName}</strong>.
          </p>

          <!-- Display failure message from action -->
          <!-- Check if form exists, has message, AND success is explicitly false -->
          {#if form?.message && form?.success === false}
            <div class="alert alert-warning mt-4">
              <span>{form.message}</span>
            </div>
          {/if}

          <form method="POST" action="?/acceptInvite" use:enhance>
            <input type="hidden" name="token" value={token ?? ""} />
            <div class="card-actions justify-end mt-4">
              <button type="submit" class="btn btn-primary"
                >Accept Invitation</button
              >
            </div>
          </form>
        </div>
      </div>
    {:else}
      <!-- Logged In User DOES NOT MATCH Invited Email -->
      <div class="alert alert-warning shadow-lg">
        <div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="stroke-current flex-shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            /></svg
          >
          <span>
            This invitation is intended for <strong>{invitedEmail}</strong>. You
            are currently logged in as <strong>{loggedInUserEmail}</strong>.
          </span>
        </div>
      </div>
      <div class="mt-4 text-center">
        <p class="mb-4">
          Please log out and sign in as {invitedEmail}, or sign up with that
          email address.
        </p>
        <form action="/logout" method="post">
          <button type="submit" class="btn btn-outline mr-2">Log Out</button>
        </form>
        <a href={loginUrlWithRedirect} class="link link-secondary"
          >Log In as different user</a
        >
      </div>
    {/if}
  {:else}
    <!-- User is NOT Logged In -->
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title">Invitation to join {teamName}</h2>
        <p>
          You've been invited to join <strong>{teamName}</strong> as
          <strong>{invitedEmail}</strong>.
        </p>

        {#if accountExistsForEmail}
          <!-- Account Exists for Invited Email -->
          <div class="alert alert-info mt-4">
            <span
              >An account already exists for {invitedEmail}. Please log in to
              accept.</span
            >
          </div>
          <div class="card-actions justify-center mt-4">
            <a href={loginUrlWithRedirect} class="btn btn-primary">Log In</a>
          </div>
        {:else}
          <!-- No Account Exists for Invited Email -->
          <div class="alert alert-info mt-4">
            <span
              >To accept this invitation, please create an account using {invitedEmail}.</span
            >
          </div>
          <div class="card-actions justify-center mt-4">
            <a href={signupUrlWithRedirect} class="btn btn-primary">Sign Up</a>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
