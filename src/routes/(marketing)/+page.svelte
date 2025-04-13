<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { browser } from "$app/environment"
  import {
    WebsiteName,
    WebsiteBaseUrl,
    WebsiteDescription,
  } from "./../../config" // Assuming config is in src/config.ts or similar

  // SEO and JSON-LD setup
  const ldJson = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: WebsiteName,
    url: WebsiteBaseUrl,
  }
  const jsonldScript = `<script type="application/ld+json">${
    JSON.stringify(ldJson) + "<"
  }/script>`

  // Define sections for easier readability
  const sections = [
    {
      title: "Overcome Creative Friction",
      description:
        "Stop wrestling with scattered notes and endless decisions. Our structured approach helps you focus your vision. Future curated assets (Virtual Studio System) will provide inspiring starting points, reducing early-stage bottlenecks.",
      icon: "🧩", // Placeholder icon
    },
    {
      title: "Ensure Asset Consistency",
      description:
        "Plan for cross-platform coherence from day one. Define your world, characters, and props centrally. Our future shared asset library will ensure seamless visual and narrative integration across all your transmedia outputs.",
      icon: "🔗", // Placeholder icon
    },
    {
      title: "Accessible & Inspiring",
      description:
        "Get started for free with essential planning tools. Our platform democratizes access to structured creativity. Future curated assets and AI tools will level the playing field, sparking new ideas and enabling high-quality concepting.",
      icon: "💡", // Placeholder icon
    },
    {
      title: "Build Investable IP",
      description:
        "Move beyond just a script. Develop a validated narrative ecosystem with demonstrated audience engagement (via feedback logging & community). Present investors with a compelling, de-risked package ready for large-scale production.",
      icon: "📈", // Placeholder icon
    },
  ]
</script>

<svelte:head>
  <title>{WebsiteName} - The Transmedia IDE</title>
  <meta name="description" content={WebsiteDescription} />
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html jsonldScript}
</svelte:head>

<!-- Hero Section (Your Existing Code - Slightly Enhanced) -->
<div class="hero min-h-[70vh] bg-base-200">
  <div class="hero-content text-center py-16 px-4">
    <div class="max-w-3xl">
      <div
        class="text-lg md:text-xl font-bold uppercase tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent mb-3 md:mb-5 pb-1"
      >
        Your Transmedia IDE
      </div>

      <h1 class="text-4xl md:text-6xl font-bold mb-4" style="line-height: 1.2;">
        Orchestrate Your Transmedia Universe:
        <span class="text-primary">Plan</span>,
        <span class="text-secondary">Engage</span>,
        <span class="text-accent">Scale</span>.
      </h1>

      <p class="py-6 text-lg md:text-xl text-base-content/80">
        The strategic platform for visionary creators. Structure your narrative
        world, cultivate your audience, and build investable intellectual
        property beyond traditional limits.
      </p>

      <div
        class="mt-6 md:mt-8 flex flex-row flex-wrap gap-4 place-content-center"
      >
        <a href="/pricing" class="btn btn-primary btn-lg px-8 shadow-lg">
          Get Started Free
        </a>
        <a href="/roadmap" class="btn btn-ghost btn-lg px-8">
          Explore the Vision
        </a>
      </div>
    </div>
  </div>
</div>

<!-- Main Content Area -->
<div class="container mx-auto px-4 py-16 sm:py-24 space-y-16 sm:space-y-24">
  <!-- Section 1: The Problem & The IDE Solution -->
  <section class="text-center">
    <h2 class="text-3xl md:text-4xl font-bold mb-4">
      Tired of Limits? Build Beyond Them.
    </h2>
    <p class="text-lg md:text-xl text-base-content/80 max-w-3xl mx-auto mb-12">
      Bringing ambitious, multi-platform stories to life is complex. Scattered
      ideas, creative bottlenecks, and the struggle for validation can stall
      even the best concepts. The
      <span class="font-semibold text-primary">{WebsiteName} IDE</span> provides
      the structure and (future) tools to turn that complexity into your advantage.
    </p>
    <!-- Feature/Benefit Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
      {#each sections as section}
        <div
          class="card bg-base-200 shadow-md hover:shadow-lg transition-shadow p-6 text-left"
        >
          <div class="text-4xl mb-4">{section.icon}</div>
          <h3 class="text-xl font-semibold mb-2">{section.title}</h3>
          <p class="text-base-content/80 text-sm">{section.description}</p>
        </div>
      {/each}
    </div>
  </section>

  <!-- Section 2: How it Works (Simplified Workflow) -->
  <section>
    <h2 class="text-3xl md:text-4xl font-bold text-center mb-12">
      Your Workflow, Elevated
    </h2>
    <ul class="steps steps-vertical lg:steps-horizontal w-full">
      <li class="step step-primary">
        <span class="text-left font-semibold"
          >1. Plan & Structure<br /><span
            class="font-normal text-sm text-base-content/70"
            >Define your story, world, characters, and strategy using the Bible
            framework.</span
          ></span
        >
      </li>
      <li class="step step-primary">
        <span class="text-left font-semibold"
          >2. Ideate & Visualize<br /><span
            class="font-normal text-sm text-base-content/70"
            >Upload assets. (Future: Use integrated AI & curated assets to bring
            ideas to life).
          </span></span
        >
      </li>
      <li class="step step-secondary">
        <span class="text-left font-semibold"
          >3. Connect & Engage<br /><span
            class="font-normal text-sm text-base-content/70"
            >Share concepts, gather feedback via Discord, and log insights.</span
          ></span
        >
      </li>
      <li class="step step-accent">
        <span class="text-left font-semibold"
          >4. Iterate & Grow<br /><span
            class="font-normal text-sm text-base-content/70"
            >Refine your vision, build your audience, and develop your
            investable IP.</span
          ></span
        >
      </li>
    </ul>
  </section>

  <!-- Section 3: Built for Visionaries -->
  <section class="text-center bg-base-300 p-8 sm:p-12 rounded-lg shadow-inner">
    <h2 class="text-3xl md:text-4xl font-bold mb-4">
      Built for the Next Generation of Storytellers
    </h2>
    <p class="text-lg md:text-xl text-base-content/80 max-w-3xl mx-auto mb-8">
      If you're an indie filmmaker, game developer, world-builder, or author
      with a story that breaks the mold, this platform is designed for you. We
      empower creators aiming for significant cultural impact with the tools to
      build narrative ecosystems.
    </p>
    <a
      href="https://discord.gg/b8mRN9zccn"
      target="_blank"
      rel="noopener noreferrer"
      class="btn btn-accent"
    >
      Join the Creator Community
    </a>
  </section>

  <!-- Section 4: Future Vision Teaser -->
  <section class="text-center">
    <h2 class="text-3xl md:text-4xl font-bold mb-4">
      The Future is Integrated
    </h2>
    <p class="text-lg md:text-xl text-base-content/80 max-w-3xl mx-auto mb-8">
      We're actively developing integrated AI tools for accelerated creation and
      the "Virtual Studio System" with curated assets. These powerful features,
      planned for our paid tiers, will further streamline your workflow and
      enhance your creative potential.
    </p>
    <a href="/roadmap" class="btn btn-outline btn-secondary">
      View Our Full Roadmap
    </a>
  </section>

  <!-- Section 5: Final Call to Action -->
  <section class="text-center pt-8">
    <h2 class="text-3xl md:text-4xl font-bold mb-4">
      Ready to Build Your Universe?
    </h2>
    <p class="text-lg md:text-xl text-base-content/80 max-w-3xl mx-auto mb-8">
      Start structuring your transmedia vision today. Sign up for our free plan
      and join a community of forward-thinking creators.
    </p>
    <a href="/pricing" class="btn btn-primary btn-lg px-10 shadow-lg">
      Get Started Now
    </a>
  </section>
</div>
