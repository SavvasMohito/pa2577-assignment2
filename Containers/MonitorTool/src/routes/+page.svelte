<script lang="ts">
	const { data } = $props();
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>

{#if Array.isArray(data.data)}
	{#each data.data as update}
		<pre>{JSON.stringify(update, null, 2)}</pre>
	{/each}
{:else}
	<p>No updates available</p>
{/if}
