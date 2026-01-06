<script lang="ts">
	import Button from '$lib/components/Button.svelte';
</script>

<svelte:head>
	<title>Sign Out - Auth App</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center py-12 px-4">
	<div class="max-w-md w-full text-center">
		<h2 class="text-2xl font-bold text-gray-900 mb-4">Sign Out</h2>
		<p class="text-gray-600 mb-6">Are you sure you want to sign out?</p>
		<form method="POST" class="space-y-4">
			<Button type="submit" variant="danger" class="w-full">Yes, Sign Out</Button>
			<a href="/dashboard">
				<Button type="button" variant="secondary" class="w-full">Cancel</Button>
			</a>
		</form>
	</div>
</div>