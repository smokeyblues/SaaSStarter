<!-- src/routes/roadmap/+page.svelte -->
<script lang="ts">
  import { browser } from "$app/environment"

  // You might fetch dynamic roadmap data here in the future,
  // but for now, we'll keep it static in the markup.

  // SEO Head section
  import { MetaTags } from "svelte-meta-tags" // Using svelte-meta-tags, adjust if using another library
</script>

<MetaTags
  title="Roadmap - Transmedia IDE"
  description="Explore the current features and future vision for the Transmedia IDE platform. See what's coming next, including AI tools and the Virtual Studio System."
  openGraph={{
    type: "website",
    url: browser ? window.location.href : "https://nanowritlabs.com/roadmap",
    title: "Roadmap - Transmedia IDE",
    description:
      "Our vision for the future of transmedia creation: Planning, AI tools, curated assets, and community.",
    // image: 'YOUR_PREVIEW_IMAGE_URL' // Optional: Add a relevant preview image URL
  }}
/>

<div class="container mx-auto px-4 py-8 sm:py-12 bg-base-100 text-base-content">
  <h1 class="text-3xl sm:text-4xl font-bold text-center mb-4">
    Our Roadmap: Building the Transmedia IDE
  </h1>
  <p
    class="text-lg text-center text-base-content/80 max-w-3xl mx-auto mb-10 sm:mb-16"
  >
    We're building the first **Integrated Transmedia Development Environment
    (IDE)** – a platform designed to empower creators like you to plan, develop,
    manage, and cultivate investable narrative universes. Here’s a look at
    what's available now and what we're working on next.
  </p>

  <!-- Grid for Roadmap Sections -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
    <!-- Section: Live Now (MVP) -->
    <div
      class="card bg-base-200 shadow-lg p-6 transition-shadow hover:shadow-xl"
    >
      <h2 class="text-2xl font-semibold mb-4 border-b pb-2 border-primary">
        🚀 Live Now (MVP Features)
      </h2>
      <p class="mb-4 text-base-content/80">
        The foundation for planning your transmedia projects:
      </p>
      <ul class="list-disc list-inside space-y-2">
        <li>Structured Project Bible Sections (Treatment, Business)</li>
        <li>Rich Text Editing for detailed descriptions</li>
        <li>Basic Asset Uploads (Images, PDFs) within sections</li>
        <li>Manual Feedback Logging tool</li>
        <li>Team Creation & Basic Collaboration Invites</li>
        <li>
          Community Hub Access via Discord <span
            class="badge badge-ghost text-xs">All Tiers</span
          >
        </li>
      </ul>
    </div>

    <!-- Section: Near-Term Plans (V1.x) -->
    <div
      class="card bg-base-200 shadow-lg p-6 transition-shadow hover:shadow-xl"
    >
      <h2 class="text-2xl font-semibold mb-4 border-b pb-2 border-secondary">
        🛠️ Near-Term Plans (Coming Soon)
      </h2>
      <p class="mb-4 text-base-content/80">
        Enhancing planning and introducing creation tools:
      </p>
      <ul class="list-disc list-inside space-y-2">
        <li>Remaining Bible Sections (Functional, Design, Tech)</li>
        <li>Enhanced Asset Management (Tagging, Central View - conceptual)</li>
        <li>
          **First AI Tool:** Concept Image Generation
          <span class="badge badge-primary badge-outline text-xs ml-1"
            >Producer+</span
          >
        </li>
        <li>Basic In-App Commenting on Bible Sections</li>
        <li>Simple Project Export Options (e.g., Text/Markdown)</li>
        <li>Refined UI/UX based on initial feedback</li>
      </ul>
    </div>

    <!-- Section: Longer-Term Vision (V2.0+) -->
    <div
      class="card bg-base-200 shadow-lg p-6 transition-shadow hover:shadow-xl"
    >
      <h2 class="text-2xl font-semibold mb-4 border-b pb-2 border-accent">
        ✨ Longer-Term Vision
      </h2>
      <p class="mb-4 text-base-content/80">Building the full Transmedia IDE:</p>
      <ul class="list-disc list-inside space-y-2">
        <li>
          **Virtual Studio System:** Curated library of environments & virtual
          actors
          <span class="badge badge-primary badge-outline text-xs ml-1"
            >Premium Tiers</span
          >
        </li>
        <li>
          **Expanded AI Suite:** Voice generation, storyboard assistance,
          potential insights
          <span class="badge badge-primary badge-outline text-xs ml-1"
            >Tiered Access</span
          >
        </li>
        <li>Interactive 3D Environment Previews</li>
        <li>Advanced In-App Collaboration & Community Features</li>
        <li>Audience Engagement Analytics Integrations (Conceptual)</li>
        <li>Streamlined workflows from planning to asset creation</li>
      </ul>
    </div>
  </div>

  <!-- Community Involvement Section -->
  <div class="text-center bg-base-300 p-8 rounded-lg shadow-md">
    <h2 class="text-2xl font-semibold mb-4">Shape the Future!</h2>
    <p class="mb-6 text-base-content/80 max-w-2xl mx-auto">
      This roadmap is a living document, guided by our vision and **your
      feedback**. Join our community on Discord to discuss these features,
      suggest new ideas, and help us prioritize what matters most to transmedia
      creators.
    </p>
    <a
      href="https://discord.gg/xNNDvNkKAS"
      target="_blank"
      rel="noopener noreferrer"
      class="btn btn-primary"
    >
      Join our Discord Community
    </a>
    <!-- Example: You might link to a feedback board later -->
    <a href="/contact_us" class="btn btn-ghost ml-4">Suggest a Feature</a>
  </div>

  <!-- Disclaimer -->
  <p class="text-center text-sm italic text-base-content/60 mt-8">
    Please note: This roadmap outlines our current plans and aspirations.
    Priorities and timelines may shift based on ongoing development, user
    feedback, and market conditions. Features listed for paid tiers indicate our
    planned direction for providing premium value.
  </p>
</div>

<!-- <style>
  /* Add any component-specific styles here if needed, */
  /* but Tailwind should handle most of it. */
  .card {
    /* Ensure cards have a consistent height or allow natural flow */
  }
</style> -->
