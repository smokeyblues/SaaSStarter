<script lang="ts">
  import type { PageData } from "./$types"

  let { data }: { data: PageData } = $props()
</script>

<div>
  <h1 class="text-4xl font-bold mb-4">Treatment</h1>
  <p class="text-lg mb-4">
    This is the treatment page for project {data.project?.name ?? "Unknown"}.
  </p>
</div>
