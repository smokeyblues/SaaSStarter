<script lang="ts">
  import { page } from "$app/stores"
</script>

<section class="max-w-2xl mx-auto py-12">
  <h1 class="text-3xl font-bold mb-4">Goals</h1>
  <p class="mb-8 text-base-content/80">
    Welcome! Here you can manage all the goals sections for your project. Choose
    a section below to get started or continue editing.
  </p>
  <div class="grid gap-4 grid-cols-1 md:grid-cols-2">
    <a class="btn btn-primary w-full" href="goals/user">User Goals</a>
    <a class="btn btn-primary w-full" href="goals/creative">Creative Goals</a>
    <a class="btn btn-primary w-full" href="goals/economic">Economic Goals</a>
  </div>
</section>
