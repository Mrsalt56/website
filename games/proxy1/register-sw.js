"use strict";

// Stock UV service worker (served from /uv/sw.js)
const stockSW = "/uv/sw.js";
const scramjetSW = "./sw.js";

/**
 * List of hostnames that are allowed to run serviceworkers on http://
 */
const swAllowedHostnames = ["localhost", "127.0.0.1"];

/**
 * Get current proxy settings from localStorage
 */
function getProxySettings() {
	try {
		const saved = localStorage.getItem('endis_proxy_settings');
		if (saved) {
			return JSON.parse(saved);
		}
	} catch (e) {
		console.error('Failed to load settings:', e);
	}
	return {
		backend: 'ultraviolet',
		transport: 'bare',
		customServer: '',
		useCustomServer: false
	};
}

/**
 * Get the transport URL based on settings
 * Bare is default and more stable than Wisp
 */
function getTransportUrl() {
	const settings = getProxySettings();

	if (settings.useCustomServer && settings.customServer) {
		return settings.customServer;
	}

	// Default to Bare server
	return location.origin + '/bare/';
}

/**
 * Global util - Register UV service worker
 * Used in 404.html and index.html
 */
async function registerSW() {
	if (!navigator.serviceWorker) {
		if (
			location.protocol !== "https:" &&
			!swAllowedHostnames.includes(location.hostname)
		)
			throw new Error("Service workers cannot be registered without https.");

		throw new Error("Your browser doesn't support service workers.");
	}

	await navigator.serviceWorker.register(stockSW);
}

/**
 * Register service worker for a specific backend
 */
async function registerSWForBackend(backend) {
	if (!navigator.serviceWorker) {
		if (
			location.protocol !== "https:" &&
			!swAllowedHostnames.includes(location.hostname)
		)
			throw new Error("Service workers cannot be registered without https.");

		throw new Error("Your browser doesn't support service workers.");
	}

	if (backend === 'scramjet') {
		await navigator.serviceWorker.register(scramjetSW);
	} else {
		await navigator.serviceWorker.register(stockSW);
	}
}
