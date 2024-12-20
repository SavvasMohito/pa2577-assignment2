<script lang="ts">
	const { data } = $props();
</script>

<div>
	<h2 class="text-xl font-semibold">Logs</h2>
	<div class="flex flex-col rounded-lg border p-4">
		{#if Array.isArray(data.data)}
			{#each data.data as update}
				<span>
					{new Date(update.timestamp).toISOString().slice(0, 19).replace('T', ' ')}: {update.message}
				</span>
			{/each}
		{:else}
			<p>No updates available</p>
		{/if}
	</div>
</div>
