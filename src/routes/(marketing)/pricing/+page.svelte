<script lang="ts">
  import PricingModule from "./pricing_module.svelte"
  import { WebsiteName } from "./../../../config"
  import { browser } from "$app/environment"
  import { MetaTags } from "svelte-meta-tags" // Assuming usage
  import { pricingPlans } from "./pricing_plans" // Make sure path is correct

  type PlanFeatureRow = {
    name: string
    creativeIncluded?: boolean // Corresponds to 'free' tier
    producerIncluded?: boolean // Corresponds to 'mid' tier
    executiveIncluded?: boolean // Corresponds to 'high' tier
    creativeString?: string
    producerString?: string
    executiveString?: string
    header?: boolean
    tooltip?: string // Optional: Add tooltips for feature explanations
  }

  const planFeatures: PlanFeatureRow[] = [
    // --- Core Planning ---
    {
      name: "Core Planning Tools",
      header: true,
    },
    {
      name: "Structured Bible Sections (Treat, Biz, Func, Design, Tech)",
      creativeIncluded: true, // Assuming all sections available structure-wise
      producerIncluded: true,
      executiveIncluded: true,
      tooltip:
        "Access all sections of the Transmedia Production Bible framework.",
    },
    {
      name: "Rich Text Editing",
      creativeIncluded: true,
      producerIncluded: true,
      executiveIncluded: true,
    },
    {
      name: "Manual Feedback Log",
      creativeIncluded: true,
      producerIncluded: true,
      executiveIncluded: true,
      tooltip: "Manually record feedback received from external sources.",
    },
    // --- Collaboration & Projects ---
    {
      name: "Collaboration & Projects",
      header: true,
    },
    {
      name: "Projects",
      creativeString: "1",
      producerString: "5",
      executiveString: "Unlimited",
    },
    {
      name: "Team Members",
      creativeString: "1 (Solo)",
      producerString: "Up to 5",
      executiveString: "Up to 15+", // Or "Contact Us"
    },
    {
      name: "Basic Project Export (Text/Markdown)",
      creativeIncluded: false,
      producerIncluded: true,
      executiveIncluded: true,
      tooltip: "Export your bible content for offline use or sharing.",
    },
    // --- Assets & Creation ---
    {
      name: "Assets & Creation",
      header: true,
    },
    {
      name: "Asset Storage",
      creativeString: "100 MB",
      producerString: "1 GB",
      executiveString: "10 GB+", // Example limits
    },
    {
      name: "AI Concept Image Generation (Future)",
      creativeIncluded: false,
      producerString: "Limited Credits (Soon)",
      executiveString: "More Credits (Soon)",
      tooltip: "Planned feature: Generate visuals directly from descriptions.",
    },
    {
      name: "Virtual Studio Asset Library Access (Future)",
      creativeIncluded: false,
      producerString: "View Access (Planned)",
      executiveString: "Usage Access (Planned)",
      tooltip: "Planned feature: Use curated environments & characters.",
    },
    // --- Community & Support ---
    {
      name: "Community & Support",
      header: true,
    },
    {
      name: "Discord Community Access",
      creativeIncluded: true,
      producerIncluded: true,
      executiveIncluded: true,
    },
    {
      name: "Standard Email Support",
      creativeIncluded: false, // Or basic support
      producerIncluded: true,
      executiveIncluded: true,
    },
    {
      name: "Priority Support",
      creativeIncluded: false,
      producerIncluded: false,
      executiveIncluded: true,
    },
  ]

  let interval: "monthly" | "annual" = $state("annual")

  // Reactive filtering of plans based on interval and corrected IDs
  const displayedPlans = $derived(
    pricingPlans.filter((plan) => {
      const idLower = plan.id.toLowerCase() // Normalize ID
      const isAnnual = plan.priceIntervalName.toLowerCase().includes("year")

      if (idLower === "creative") return true // Always show Creative plan

      if (interval === "monthly") {
        return !isAnnual && (idLower === "producer" || idLower === "executive") // Show monthly Producer & Executive
      } else {
        // interval === 'annual'
        return (
          isAnnual &&
          (idLower.includes("producer") || idLower.includes("executive"))
        ) // Show annual Producer & Executive
      }
    }),
  )
</script>

<!-- <svelte:head>
  <title>Pricing</title>
  <meta name="description" content="Pricing - {WebsiteName}" />
</svelte:head> -->

<svelte:head>
  <title>Pricing - {WebsiteName}</title>
  <meta
    name="description"
    content="Choose the right plan to start building your Transmedia Universe with the {WebsiteName} IDE. Free and paid options available."
  />
  <!-- Include MetaTags component if using -->
  <!-- REMOVE MetaTags from here -->
</svelte:head>

<div class="min-h-[70vh] pb-16 pt-[8vh] px-4 bg-base-100 text-base-content">
  <!-- ADD MetaTags here -->
  <MetaTags
    title={`Pricing - ${WebsiteName}`}
    description={`Choose the right plan for the ${WebsiteName} Transmedia IDE.`}
    openGraph={{
      title: `Pricing - ${WebsiteName}`,
      description:
        "Explore free and paid plans designed for transmedia creators.",
      // Add image, url etc.
    }}
  />

  <!-- Header -->
  <div class="text-center max-w-3xl mx-auto mb-12">
    <h1 class="text-4xl md:text-5xl font-bold mb-4">
      Choose Your Plan & Start Building
    </h1>
    <p class="text-lg md:text-xl text-base-content/80">
      Select the right tier for your transmedia ambitions. Start free, unlock
      team features, and get ready for powerful future tools within the
      Transmedia IDE.
    </p>
  </div>

  <!-- Monthly/Annual Toggle -->
  <div class="flex justify-center items-center space-x-4 mb-12">
    <span
      class={interval === "monthly"
        ? "font-semibold text-primary"
        : "text-base-content/70"}>Monthly</span
    >
    <input
      type="checkbox"
      class="toggle toggle-primary toggle-lg"
      checked={interval === "annual"}
      onchange={() =>
        (interval = interval === "monthly" ? "annual" : "monthly")}
      aria-label="Toggle Annual Pricing"
    />
    <span
      class={interval === "annual"
        ? "font-semibold text-primary"
        : "text-base-content/70"}>Annual</span
    >
    {#if interval === "annual"}
      <span class="badge badge-primary badge-outline ml-2">Save ~17%</span>
    {:else}
      <span class="badge badge-accent badge-outline ml-2">Save ~17%</span>
    {/if}
  </div>

  <!-- Pricing Cards - Pass filtered plans -->
  <!-- Pass currentPlanId if user is logged in -->
  <div class="w-full max-w-6xl mx-auto my-8">
    <PricingModule
      plansToDisplay={displayedPlans}
      callToAction="Select Plan"
      highlightedPlanId="producer"
      center={true}
    />
  </div>

  <!-- Feature Comparison Table -->
  <div class="max-w-4xl mx-auto mt-24">
    <h1 class="text-3xl font-bold text-center mb-4">Feature Comparison</h1>
    <p class="text-center text-base-content/70 mb-8">How the plans stack up.</p>

    <div class="overflow-x-auto shadow-md rounded-lg">
      <table class="table w-full text-sm">
        <thead class="text-base bg-base-200 sticky top-0 z-10 backdrop-blur-sm">
          <tr>
            <th class="w-1/3">Feature</th>
            <th class="text-center"
              >Creative<br /><span class="text-xs font-normal">(Free)</span></th
            >
            <th class="text-center text-primary"
              >Producer<br /><span class="text-xs font-normal">(Paid)</span></th
            >
            <th class="text-center text-secondary"
              >Executive<br /><span class="text-xs font-normal">(Paid+)</span
              ></th
            >
          </tr>
        </thead>
        <tbody class="bg-base-100">
          {#each planFeatures as feature, i (feature.name)}
            {#if feature.header}
              <tr class="bg-base-300 font-semibold text-base">
                <!-- Use pt-4 on first header, mt-2 on subsequent headers for spacing -->
                <td colspan="4" class={i === 0 ? "pt-4 pb-2" : "mt-2 pt-4 pb-2"}
                  >{feature.name}
                </td>
              </tr>
            {:else}
              <tr
                class="hover:bg-base-200/50 border-b border-base-200 last:border-b-0"
              >
                <td class="py-3">
                  {feature.name}
                  {#if feature.tooltip}
                    <div
                      class="tooltip tooltip-right"
                      data-tip={feature.tooltip}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        class="stroke-info shrink-0 w-4 h-4 ml-1 inline align-middle cursor-pointer"
                        ><path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        ></path></svg
                      >
                    </div>
                  {/if}
                </td>
                <!-- Creative Tier -->
                <td class="text-center py-3">
                  {#if feature.creativeString}
                    <span class="font-medium">{feature.creativeString}</span>
                  {:else if feature.creativeIncluded}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="w-6 h-6 mx-auto inline text-success"
                      ><use href="#checkcircle" /></svg
                    >
                  {:else}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="w-5 h-5 mx-auto inline text-base-300"
                      ><use href="#nocircle" /></svg
                    >
                  {/if}
                </td>
                <!-- Producer Tier -->
                <td class="text-center py-3 bg-primary/5">
                  <!-- Subtle highlight -->
                  {#if feature.producerString}
                    <span class="font-medium text-primary"
                      >{feature.producerString}</span
                    >
                  {:else if feature.producerIncluded}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="w-6 h-6 mx-auto inline text-success"
                      ><use href="#checkcircle" /></svg
                    >
                  {:else}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="w-5 h-5 mx-auto inline text-base-300"
                      ><use href="#nocircle" /></svg
                    >
                  {/if}
                </td>
                <!-- Executive Tier -->
                <td class="text-center py-3">
                  {#if feature.executiveString}
                    <span class="font-medium text-secondary"
                      >{feature.executiveString}</span
                    >
                  {:else if feature.executiveIncluded}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="w-6 h-6 mx-auto inline text-success"
                      ><use href="#checkcircle" /></svg
                    >
                  {:else}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="w-5 h-5 mx-auto inline text-base-300"
                      ><use href="#nocircle" /></svg
                    >
                  {/if}
                </td>
              </tr>
            {/if}
          {/each}
        </tbody>
      </table>
    </div>
  </div>

  <!-- Pricing FAQ -->
  <div class="max-w-3xl mx-auto mt-24">
    <h1 class="text-3xl font-bold text-center mb-8">
      Frequently Asked Questions
    </h1>
    <div class="join join-vertical w-full shadow-md rounded-lg">
      <!-- Replace with relevant FAQs -->
      <div class="collapse collapse-arrow join-item border border-base-300">
        <input type="radio" name="faq-accordion" id="faq-1" checked />
        <label
          for="faq-1"
          class="collapse-title text-lg font-medium cursor-pointer"
        >
          What are the limits of the Free 'Creative' plan?
        </label>
        <div class="collapse-content bg-base-200/50">
          <p>
            The Creative plan is designed to get you started. It includes access
            to all core planning sections for <strong>1 project</strong>, allows
            <strong>1 team member</strong>
            (solo creator), and provides <strong>100MB</strong> of asset storage.
            You also get full access to our Discord community.
          </p>
        </div>
      </div>
      <div class="collapse collapse-arrow join-item border border-base-300">
        <input type="radio" name="faq-accordion" id="faq-2" />
        <label
          for="faq-2"
          class="collapse-title text-lg font-medium cursor-pointer"
        >
          Can I change my plan later?
        </label>
        <div class="collapse-content bg-base-200/50">
          <p>
            Absolutely! You can upgrade or downgrade between paid plans (or move
            from Free to paid) at any time through your account settings.
            Changes typically take effect at the start of your next billing
            cycle.
          </p>
        </div>
      </div>
      <div class="collapse collapse-arrow join-item border border-base-300">
        <input type="radio" name="faq-accordion" id="faq-3" />
        <label
          for="faq-3"
          class="collapse-title text-lg font-medium cursor-pointer"
        >
          When will AI & Virtual Studio features be available?
        </label>
        <div class="collapse-content bg-base-200/50">
          <p>
            These are exciting features on our roadmap! We plan to roll out
            initial AI integrations (like concept image generation) and access
            to the first Virtual Studio assets post-MVP, likely starting with
            our Producer and Executive tiers. Check our <a
              href="/roadmap"
              class="link link-primary">Roadmap page</a
            > for the latest updates.
          </p>
        </div>
      </div>
      <div class="collapse collapse-arrow join-item border border-base-300">
        <input type="radio" name="faq-accordion" id="faq-4" />
        <label
          for="faq-4"
          class="collapse-title text-lg font-medium cursor-pointer"
        >
          What payment methods do you accept?
        </label>
        <div class="collapse-content bg-base-200/50">
          <p>
            We use Stripe to securely process payments. You can use major credit
            and debit cards. During our early access phase, you might use
            Stripe's test card (4242...) as described in documentation.
          </p>
        </div>
      </div>
      <div class="collapse collapse-arrow join-item border border-base-300">
        <input type="radio" name="faq-accordion" id="faq-5" />
        <label
          for="faq-5"
          class="collapse-title text-lg font-medium cursor-pointer"
        >
          Do you offer discounts for students or non-profits?
        </label>
        <div class="collapse-content bg-base-200/50">
          <p>
            We're passionate about supporting education and impactful projects!
            Please contact us directly through our support channels to discuss
            potential discounts for verified students and non-profit
            organizations.
          </p>
        </div>
      </div>
      <!-- Add more relevant FAQs -->
    </div>
  </div>

  <!-- Hidden SVG Definitions (Keep as is) -->
  <svg style="display:none" version="2.0">
    <defs>
      <symbol
        id="checkcircle"
        viewBox="0 0 24 24"
        stroke-width="2"
        fill="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path
          d="M16.417 10.283A7.917 7.917 0 1 1 8.5 2.366a7.916 7.916 0 0 1 7.917 7.917zm-4.105-4.498a.791.791 0 0 0-1.082.29l-3.828 6.63-1.733-2.08a.791.791 0 1 0-1.216 1.014l2.459 2.952a.792.792 0 0 0 .608.285.83.83 0 0 0 .068-.003.791.791 0 0 0 .618-.393L12.6 6.866a.791.791 0 0 0-.29-1.081z"
        />
      </symbol>
    </defs>
  </svg>
  <svg style="display:none" version="2.0">
    <defs>
      <symbol id="nocircle" viewBox="0 0 24 24" fill="currentColor">
        <path
          d="M12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Zm4,11H8a1,1,0,0,1,0-2h8a1,1,0,0,1,0,2Z"
        />
      </symbol>
    </defs>
  </svg>
</div>
