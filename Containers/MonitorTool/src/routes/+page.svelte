<script lang="ts">
	const { data } = $props();
</script>

<div class="grid w-full grid-cols-3 gap-2">
	<div class="flex flex-1 flex-col">
		<h2 class="text-xl font-semibold">Collection Counts</h2>
		<div class="flex flex-1 flex-col rounded-lg border bg-gray-100 p-4">
			{#each Object.entries(data.collectionCounts) as [key, count]}
				<span>
					{key.charAt(0).toUpperCase() + key.slice(1)}: {count}
				</span>
			{/each}
		</div>
	</div>

	<div class="col-span-2 flex flex-1 flex-col">
		<h2 class="text-xl font-semibold">Logs</h2>
		<div class="flex flex-1 flex-col rounded-lg border bg-gray-100 p-4">
			{#each data.statusUpdates as update}
				<span>
					{new Date(update.timestamp).toISOString().slice(0, 19).replace('T', ' ')}: {update.message}
				</span>
			{/each}
		</div>
	</div>
</div>
