<script lang="ts">
  import { page } from "$app/stores"
</script>

<section class="max-w-2xl mx-auto py-12">
  <h1 class="text-3xl font-bold mb-4">Business Overview</h1>
  <p class="mb-8 text-base-content/80">
    Welcome! Here you can manage all the business sections for your project.
    Choose a section below to get started or continue editing.
  </p>
  <div class="grid gap-4 grid-cols-1 md:grid-cols-2">
    <a class="btn btn-primary w-full" href="business/goals">Goals</a>
    <a class="btn btn-primary w-full" href="business/success_indicators"
      >Success Indicators</a
    >
    <a class="btn btn-primary w-full" href="business/user_need">User Need</a>
    <a class="btn btn-primary w-full" href="business/audience"
      >Target Audience & Marketing</a
    >
  </div>
</section>
