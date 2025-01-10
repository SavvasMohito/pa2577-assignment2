<script lang="ts">
	import type { ProcessingMetrics } from '$lib/db/collections';
	import { onDestroy, onMount } from 'svelte';
	import { Chart, Svg, Axis, Spline, Text, Tooltip, Highlight } from 'layerchart';
	import { scaleTime, scaleOrdinal } from 'd3-scale';
	import { formatDate, PeriodType } from '@layerstack/utils';
	import { format } from 'date-fns';
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
		files: 'red',
		chunks: 'green',
		candidates: 'blue',
		clones: 'purple'
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
	let dataByKey: Map<
		string,
		{ timestamp: number; count: number; itemsPerSecond: number; itemProcessingTime: number }[]
	> = $state(new Map());

	async function fetchData() {
		fetch('/api/status')
			.then((res) => res.json())
			.then((data) => {
				statusUpdates = data.statusUpdates;
			});
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
				dataByKey = flatGroup(allStatisticsFlat, (d) => d.key);
				console.log(dataByKey);

				collectionStats = data.allStatistics[0].stats;
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

<div class="h-[300px] rounded border p-4">
	<Chart
		data={allStatisticsFlat}
		x="timestamp"
		xScale={scaleTime()}
		y="itemsPerSecond"
		yDomain={[0, null]}
		yNice
		c="key"
		cScale={scaleOrdinal()}
		cDomain={Object.keys(keyColors)}
		cRange={Object.values(keyColors)}
		padding={{ left: 16, bottom: 24, right: 48 }}
		tooltip={{ mode: 'voronoi' }}
		let:cScale
	>
		<Svg>
			<Axis placement="left" grid rule />
			<Axis
				placement="bottom"
				format={(d) => formatDate(d, PeriodType.Day, { variant: 'short' })}
				rule
			/>
			{#each dataByKey as [key, data]}
				{@const color = cScale?.(key)}
				<Spline {data} class="stroke-2" stroke={color}>
					<svelte:fragment slot="end">
						<circle r={4} fill={color} />
						<Text value={key} verticalAnchor="middle" dx={6} dy={-2} class="text-xs" fill={color} />
					</svelte:fragment>
				</Spline>
			{/each}
			<Highlight points lines />
		</Svg>

		<Tooltip.Root let:data>
			<Tooltip.Header>{format(data.date, 'eee, MMMM do')}</Tooltip.Header>
			<Tooltip.List>
				<Tooltip.Item label={data.fruit} value={data.value} />
			</Tooltip.List>
		</Tooltip.Root>
	</Chart>
</div>

<div class="grid w-full grid-cols-5 gap-2">
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
