<script lang="ts">
  import { page } from "$app/stores"
</script>

<section class="max-w-2xl mx-auto py-12">
  <h1 class="text-3xl font-bold mb-4">Project Treatment Overview</h1>
  <p class="mb-8 text-base-content/80">
    Welcome! Here you can manage all the narrative and planning sections for
    your project. Choose a section below to get started or continue editing.
  </p>
  <div class="grid gap-4 grid-cols-1 md:grid-cols-2">
    <a class="btn btn-primary w-full" href="treatment/tagline">Tagline</a>
    <a class="btn btn-primary w-full" href="treatment/backstory"
      >Back Story & Context</a
    >
    <a class="btn btn-primary w-full" href="treatment/synopsis">Synopsis</a>
    <a class="btn btn-primary w-full" href="treatment/plotpoints">Plot Points</a
    >
    <a class="btn btn-primary w-full" href="treatment/characterization"
      >Characterization & Attitude</a
    >
    <a class="btn btn-primary w-full" href="treatment/scripts">Scripts</a>
    <a class="btn btn-primary w-full" href="treatment/scenarios"
      >User-centric Scenarios</a
    >
  </div>
</section>
