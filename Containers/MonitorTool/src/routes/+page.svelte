<script lang="ts">
	const { data } = $props();
</script>

<div>
	<h2 class="text-xl font-semibold">Logs</h2>
	<div class="flex flex-col rounded-lg border bg-gray-100 p-4">
		{#each data.statusUpdates as update}
			<span>
				{new Date(update.timestamp).toISOString().slice(0, 19).replace('T', ' ')}: {update.message}
			</span>
		{/each}
	</div>
</div>
