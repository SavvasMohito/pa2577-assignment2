<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

	type StatusUpdate = {
		timestamp: string;
		message: string;
	};

	type CollectionCounts = {
		[key: string]: number;
	};

	let statusUpdates: StatusUpdate[] = $state([]);
	let collectionCounts: CollectionCounts = $state({});

	async function fetchData() {
		fetch('/api/status')
			.then((res) => res.json())
			.then((data) => {
				statusUpdates = data.statusUpdates;
			});
		fetch('/api/counts')
			.then((res) => res.json())
			.then((data) => {
				collectionCounts = data.collectionCounts;
			});
	}

	onMount(async () => {
		await fetchData();
	});

	const interval = setInterval(fetchData, 5000);

	onDestroy(() => {
		interval && clearInterval(interval);
	});
</script>

<div class="grid w-full grid-cols-3 gap-2">
	<div class="flex flex-1 flex-col">
		<h2 class="text-xl font-semibold">Collection Counts</h2>
		<div class="flex flex-1 flex-col rounded-lg border bg-gray-100 p-4">
			{#if Object.keys(collectionCounts).length === 0}
				<span>Loading...</span>
			{:else}
				{#each Object.entries(collectionCounts) as [key, count]}
					<span>
						{key.charAt(0).toUpperCase() + key.slice(1)}: {count}
					</span>
				{/each}
			{/if}
		</div>
	</div>

	<div class="col-span-2 flex flex-1 flex-col">
		<h2 class="text-xl font-semibold">Logs</h2>
		<div class="flex flex-1 flex-col rounded-lg border bg-gray-100 p-4">
			{#if statusUpdates.length === 0}
				<span>Loading...</span>
			{:else}
				{#each statusUpdates as update}
					<span>
						{new Date(update.timestamp).toISOString().slice(0, 19).replace('T', ' ')}: {update.message}
					</span>
				{/each}
			{/if}
		</div>
	</div>
</div>
