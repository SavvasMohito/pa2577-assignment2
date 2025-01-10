<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

	type StatusUpdate = {
		timestamp: string;
		message: string;
	};

	type CollectionStats = {
		timestamp: number;
		count: number;
	};

	let statusUpdates: StatusUpdate[] = $state([]);
	let collectionStats: Map<string, CollectionStats> = $state(new Map());

	async function fetchData() {
		fetch('/api/status')
			.then((res) => res.json())
			.then((data) => {
				statusUpdates = data.statusUpdates;
			});
		fetch('/api/stats')
			.then((res) => res.json())
			.then((data) => {
				collectionStats = data.collectionStats;
			});

		if (statusUpdates.length > 0 && statusUpdates[statusUpdates.length - 1].message === 'Summary') {
			clearInterval(interval);
		}
	}

	onMount(async () => {
		await fetchData();
	});

	// Update data every 10 seconds
	const interval = setInterval(fetchData, 10000);

	onDestroy(() => {
		interval && clearInterval(interval);
	});
</script>

<div class="grid w-full grid-cols-2 gap-2">
	<div class="flex flex-1 flex-col">
		<h2 class="text-xl font-semibold">Collection Counts</h2>
		<div class="flex flex-1 flex-col rounded-lg border bg-gray-100 p-4">
			{#if Object.keys(collectionStats).length === 0}
				<span>Loading...</span>
			{:else}
				{#each Object.entries(collectionStats) as [key, value]}
					<div class="mb-4">
						<h4 class="font-semibold">
							{key.charAt(0).toUpperCase() + key.slice(1)}
						</h4>
						<ul>
							<li>Count: {value.count}</li>
							{#if value.count > 0}
								<li>
									Items per second: {value.metrics.processingRate &&
										value.metrics.processingRate.toFixed(2)}
								</li>
								<li>
									Item processing time: {value.metrics.timePerDocument &&
										value.metrics.timePerDocument.toFixed(4)} ms
								</li>
							{/if}
						</ul>
					</div>
				{/each}
			{/if}
		</div>
	</div>

	<div class="flex flex-1 flex-col">
		<h2 class="text-xl font-semibold">Logs</h2>
		<div class="flex flex-1 flex-col rounded-lg border bg-gray-100 p-4">
			{#if statusUpdates.length === 0}
				<span>Loading...</span>
			{:else}
				{#each statusUpdates as update}
					<span>
						{new Date(update.timestamp).toLocaleString('en-GB')}: {update.message}
					</span>
				{/each}
			{/if}
		</div>
	</div>
</div>
