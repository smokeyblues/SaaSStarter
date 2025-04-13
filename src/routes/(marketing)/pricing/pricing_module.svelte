<!-- src/routes/pricing/pricing_module.svelte -->
<script lang="ts">
  // No longer import pricingPlans here, receive it as a prop
  // import { pricingPlans } from './pricing_plans';

  // Define the expected shape of a plan object (you might want a shared type)
  type PricingPlan = {
    id: string
    name: string
    description: string
    price: string
    priceIntervalName: string
    stripe_price_id: string | null
    stripe_product_id?: string // Optional based on your plans file
    features: string[]
  }

  interface Props {
    plansToDisplay: PricingPlan[] // Renamed prop
    highlightedPlanId?: string
    callToAction: string
    currentPlanId?: string
    center?: boolean
  }

  let {
    plansToDisplay = [], // Default to empty array
    highlightedPlanId = "",
    callToAction,
    currentPlanId = "",
    center = true,
  }: Props = $props()
</script>

<div
  class="flex flex-col lg:flex-row gap-10 {center
    ? 'place-content-center'
    : ''} flex-wrap items-stretch"
>
  {#each plansToDisplay as plan (plan.id)}
    <!-- Iterate over the prop -->
    <div
      class="card card-bordered {plan.id === highlightedPlanId ||
      plan.id === 'producer'
        ? 'border-primary' // Highlight 'producer' or the specified ID
        : 'border-base-300'} shadow-lg flex flex-col w-full sm:w-[calc(50%-1.25rem)] lg:w-[calc(33.33%-1.8rem)] max-w-[340px] p-6"
    >
      <!-- /* Makes content push footer down */ -->
      <div class="flex-grow">
        <div class="text-xl font-bold mb-2">{plan.name}</div>
        <p
          class="mt-1 text-sm text-base-content/80 leading-relaxed min-h-[60px]"
        >
          <!-- {/* Give description some min height */} -->
          {plan.description}
        </p>
        <div class="mt-4 pt-4 text-sm text-base-content/90">
          {#if plan.id !== "creative"}
            Includes Creative features, plus:{:else}Plan Includes:{/if}
          <ul class="list-disc list-inside mt-2 space-y-1 text-base-content/80">
            {#each plan.features as feature}
              <li>{feature}</li>
            {/each}
          </ul>
        </div>
      </div>

      <div class="pt-8 mt-auto">
        <!-- {/* Pushes price/button to bottom */} -->
        <div class="mb-4">
          <span class="text-4xl font-bold">{plan.price}</span>
          {#if plan.id !== "creative"}
            <span class="text-base-content/60"
              >/{plan.priceIntervalName.includes("year")
                ? "year"
                : "month"}</span
            >
          {/if}
        </div>
        <div class="mt-6 pt-4">
          {#if plan.id === currentPlanId}
            <div
              class="btn btn-outline btn-success no-animation w-full cursor-default"
            >
              Current Plan
            </div>
          {:else}
            <!-- /* Use 'creative' for free plan ID */ -->
            <a
              href={"/account/subscribe/" +
                (plan?.stripe_price_id ?? "creative")}
              class="btn {plan.id === 'creative'
                ? 'btn-outline'
                : 'btn-primary'} w-full shadow-md"
              data-sveltekit-preload-data="off"
            >
              {plan.id === "creative" ? "Start for Free" : callToAction}
            </a>
          {/if}
        </div>
      </div>
    </div>
  {/each}
</div>
