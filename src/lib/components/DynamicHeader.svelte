<script lang="ts">
  import { WebsiteName } from "../../config";
  import "../../app.css"; // Assuming app.css is needed, can be removed later
  import ThemeToggle from "$lib/components/ThemeToggle.svelte";

  export let loggedIn: boolean = false; // Default to not logged in

  let logoHref = loggedIn ? "/dashboard" : "/";

  // Define link structures based on loggedIn status
  let desktopLinks: Array<{ href: string; label: string; isComponent?: boolean, component?: any, ariaLabel?: string }>
  let mobileLinks: Array<{ href: string; label: string; isComponent?: boolean, component?: any, ariaLabel?: string }>

  $: {
    if (loggedIn) {
      desktopLinks = [
        // { href: "/blog", label: "Blog" }, // Optional: keep or remove
        { href: "/settings", label: "Settings" },
        { href: "/account/sign_out", label: "Logout" },
      ];
      mobileLinks = [ // Assuming same as marketing for now, can be adjusted
        { href: "/blog", label: "Blog" },
        { href: "/pricing", label: "Pricing" },
        { href: "/account", label: "Account" },
        { href: "/search", label: "Search" },
      ];
    } else {
      desktopLinks = [
        { href: "/blog", label: "Blog" },
        { href: "/pricing", label: "Pricing" },
        { href: "/account", label: "Account" },
      ];
      mobileLinks = [
        { href: "/blog", label: "Blog" },
        { href: "/pricing", label: "Pricing" },
        { href: "/account", label: "Account" },
        { href: "/search", label: "Search" },
      ];
    }
  }
</script>

<div class="navbar bg-base-100 container mx-auto">
  <div class="flex-1">
    <a
      class="btn btn-ghost normal-case text-4xl font-bold font-cinzel-decorative"
      href={logoHref}>{WebsiteName}</a
    >
  </div>
  <div class="flex-none">
    <ul class="menu menu-horizontal px-1 hidden sm:flex font-bold text-lg">
      {#each desktopLinks as link}
        <li class="md:mx-2"><a href={link.href}>{link.label}</a></li>
      {/each}
      <li class="md:mx-0">
        <a href="/search" aria-label="Search">
          <svg
            fill="#000000"
            class="w-6 h-6"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
            ><path
              d="M17.545 15.467l-3.779-3.779a6.15 6.15 0 0 0 .898-3.21c0-3.417-2.961-6.377-6.378-6.377A6.185 6.185 0 0 0 2.1 8.287c0 3.416 2.961 6.377 6.377 6.377a6.15 6.15 0 0 0 3.115-.844l3.799 3.801a.953.953 0 0 0 1.346 0l.943-.943c.371-.371.236-.84-.135-1.211zM4.004 8.287a4.282 4.282 0 0 1 4.282-4.283c2.366 0 4.474 2.107 4.474 4.474a4.284 4.284 0 0 1-4.283 4.283c-2.366-.001-4.473-2.109-4.473-4.474z"
              fill="currentColor"
            /></svg
          >
        </a>
      </li>
      <li class="md:mx-2">
        <ThemeToggle />
      </li>
    </ul>
    <div class="dropdown dropdown-end sm:hidden">
      <!-- svelte-ignore a11y_label_has_associated_control -->
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <label tabindex="0" class="btn btn-ghost btn-circle">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16M4 18h7"
          /></svg
        >
      </label>
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <ul
        tabindex="0"
        class="menu menu-lg dropdown-content mt-3 z-1 p-2 shadow-sm bg-base-100 rounded-box w-52 font-bold"
      >
        {#each mobileLinks as link}
          <li><a href={link.href}>{link.label}</a></li>
        {/each}
        <li> <!-- Search for mobile, assuming it's always there -->
          <a href="/search">Search</a>
        </li>
        <li>
          <ThemeToggle />
        </li>
      </ul>
    </div>
  </div>
</div>
