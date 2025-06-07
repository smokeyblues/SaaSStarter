<script lang="ts">
  import { invalidate } from "$app/navigation";
  import { onMount } from "svelte";
  import { supabase as browserSupabase } from "$lib/supabaseClient"; // Import browser client

  // data from $props will contain 'session', 'user', 'cookies' (and 'children' is a snippet)
  let { data, children }: {
    data: { session: any; user: any; cookies: any }; // Add specific types if known, e.g., from LayoutData of parent
    children?: import("svelte").Snippet
  } = $props();

  // session is from server, supabase client is imported for client-side use
  let session = $state(data.session);
  $effect(() => {
    session = data.session; // Keep session reactive to changes from data prop
  });

  onMount(() => {
    const { data: listener } = browserSupabase.auth.onAuthStateChange((event, _session) => {
      // Compare with the reactive 'session' state which is derived from server-passed 'data.session'
      if (_session?.expires_at !== session?.expires_at) {
        invalidate("supabase:auth");
      }
    });

    return () => listener.subscription.unsubscribe();
  });
</script>

{@render children?.()}
