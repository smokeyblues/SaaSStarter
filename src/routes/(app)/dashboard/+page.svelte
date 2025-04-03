<script lang="ts">
  import {
    WebsiteName,
    WebsiteBaseUrl,
    WebsiteDescription,
  } from "./../../../config"

  const ldJson = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: WebsiteName,
    url: WebsiteBaseUrl,
  }

  const jsonldScript = `<script type="application/ld+json">${
    JSON.stringify(ldJson) + "<"
  }/script>`
</script>

<svelte:head>
  <title>{WebsiteName} - Dashboard</title>
  <meta name="description" content={WebsiteDescription} />
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html jsonldScript}
</svelte:head>

<div class="hero min-h-[60vh]">
  <div class="hero-content text-center py-12">
    <div class="max-w-xl">
      <div
        class="text-xl md:text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-primary to-accent mb-3 md:mb-7 pb-1"
      >
        Your Dashboard
      </div>

      <!-- <div
        class="text-4xl md:text-6xl font-bold px-2"
        style="line-height: 1.2;"
      >
        Create, Produce, and Manage your
        <span
          class="underline decoration-secondary decoration-4 md:decoration-[6px]"
          >Transmedia Story Experiences</span
        >
      </div>
      <div
        class="mt-6 md:mt-4 flex flex-row flex-wrap gap-4 place-content-center"
      >
        <a href="/pricing">
          <button class="btn btn-outline btn-primary px-6">Get Started</button>
        </a>
      </div> -->
    </div>
  </div>
</div>
