<script lang="ts">
	import type { ProcessingMetrics } from '$lib/db/collections';
	import { onDestroy, onMount } from 'svelte';
	import { Chart, Svg, Axis, Area, Highlight } from 'layerchart';
	import { scaleTime } from 'd3-scale';
	import { formatDate, PeriodType } from '@layerstack/utils';
	import { flatGroup } from 'd3-array';

	type StatusUpdate = {
		timestamp: string;
		message: string;
	};

	type CollectionStats = {
		timestamp: number;
		count: number;
	};

	type AllStatistics = {
		timestamp: number;
		stats: { [key: string]: { count: number; metrics: ProcessingMetrics } };
	};

	const keyColors = {
		files: { fill: 'fill-red-500/30', stroke: 'stroke-2 stroke-red-500' },
		chunks: { fill: 'fill-green-500/30', stroke: 'stroke-2 stroke-green-500' },
		candidates: { fill: 'fill-blue-500/30', stroke: 'stroke-2 stroke-blue-500' },
		clones: { fill: 'fill-purple-500/30', stroke: 'stroke-2 stroke-purple-500' }
	};

	let statusUpdates: StatusUpdate[] = $state([]);
	let collectionStats: Map<string, CollectionStats> = $state(new Map());
	let allStatistics: AllStatistics[] = $state([]);
	let allStatisticsFlat: {
		timestamp: number;
		key: string;
		count: number;
		itemsPerSecond: number;
		itemProcessingTime: number;
	}[] = $state([]);
	type KeyType = 'files' | 'chunks' | 'candidates' | 'clones';

	let dataByKey: Map<
		KeyType,
		{ timestamp: number; count: number; itemsPerSecond: number; itemProcessingTime: number }[]
	> = $state(new Map());

	async function fetchData() {
		fetch('/api/status')
			.then((res) => res.json())
			.then((data) => {
				statusUpdates = data.statusUpdates;
			});

		if (statusUpdates.length > 0 && statusUpdates[statusUpdates.length - 1].message === 'Summary') {
			clearInterval(interval);
		} else {
			fetch('/api/stats')
				.then((res) => res.json())
				.then((data) => {
					allStatistics = data.allStatistics;
					allStatisticsFlat = allStatistics.flatMap((stat) => {
						return Object.entries(stat.stats).map(([key, value]) => {
							return {
								timestamp: stat.timestamp,
								key,
								count: value.count,
								itemsPerSecond: value.metrics.processingRate,
								itemProcessingTime: value.metrics.timePerDocument
							};
						});
					});
					dataByKey = new Map(flatGroup(allStatisticsFlat, (d) => d.key as KeyType));
					collectionStats = data.allStatistics[0].stats;
				});
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

{#if dataByKey.size === 0}
	<div>Loading charts...</div>
{:else}
	<div class="flex w-full flex-col gap-2">
		{#each dataByKey as [key, sf]}
			<div class="flex flex-col gap-1">
				<h2 class="text-xl font-semibold">{key}</h2>
				<div class="grid grid-cols-2 gap-2">
					<div class="h-[300px] w-full rounded border p-4">
						<h4>Items per second</h4>
						<Chart
							data={sf}
							x="timestamp"
							xScale={scaleTime()}
							y="itemsPerSecond"
							yDomain={[0, null]}
							yNice
							padding={{ left: 16, bottom: 24 }}
						>
							<Svg>
								<Axis placement="left" grid rule />
								<Axis
									placement="bottom"
									format={(d) => formatDate(d, PeriodType.DayTime, { variant: 'short' })}
									rule
								/>
								<Area line={{ class: keyColors[key].stroke }} class={keyColors[key].fill} />
								<Highlight points lines />
							</Svg>
						</Chart>
					</div>
					<div class="h-[300px] w-full rounded border p-4">
						<h4>Average item processing time (ms)</h4>
						<Chart
							data={sf}
							x="timestamp"
							xScale={scaleTime()}
							y="itemProcessingTime"
							yDomain={[0, null]}
							yNice
							padding={{ left: 16, bottom: 24 }}
							tooltip={{ mode: 'bisect-x' }}
						>
							<Svg>
								<Axis placement="left" grid rule />
								<Axis
									placement="bottom"
									format={(d) => formatDate(d, PeriodType.DayTime, { variant: 'short' })}
									rule
								/>
								<Area line={{ class: keyColors[key].stroke }} class={keyColors[key].fill} />
								<Highlight points lines />
							</Svg>
						</Chart>
					</div>
				</div>
			</div>
		{/each}
	</div>
{/if}

<div class="mt-4 grid w-full grid-cols-5 gap-2">
	<div class="col-span-3 flex flex-1 flex-col gap-1">
		<h2 class="text-xl font-semibold">Last 100 statistics</h2>
		<div class="flex flex-1 flex-col rounded-lg border bg-gray-100 p-4">
			{#if allStatistics.length === 0}
				<span>Loading...</span>
			{:else}
				{#each allStatistics.slice(0, 100) as statistics}
					<span>
						{new Date(statistics.timestamp).toLocaleString('en-GB')}: {#each Object.entries(statistics.stats) as [key, value]}
							<div>
								--{key}: count: {value.count} / items per second: {value.metrics.processingRate &&
									value.metrics.processingRate.toFixed(2)} / item processing time: {value.metrics
									.timePerDocument && value.metrics.timePerDocument.toFixed(4)} ms
							</div>
						{/each}
					</span>
				{/each}
			{/if}
		</div>
	</div>

	<div class="col-span-2 flex flex-1 flex-col gap-1">
		<h2 class="text-xl font-semibold">Status Updates</h2>
		<div class="flex flex-col rounded-lg border bg-gray-100 p-4">
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
