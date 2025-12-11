"use strict";
/**
 * Endis Proxy Utilities
 * Robust transport initialization with automatic fallbacks and error recovery
 */

// Transport configuration - ordered by preference
const TRANSPORTS = {
    // Primary: Local Bare server (most stable for general browsing)
    localBare: {
        name: 'Local Bare Server',
        module: '/baremod/index.mjs',
        getArgs: () => [location.origin + '/bare/'],
        type: 'bare'
    },
    // Local Wisp server (better for games/WebSockets)
    localWisp: {
        name: 'Local Wisp Server',
        module: '/epoxy/index.mjs',
        getArgs: () => {
            const wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
            return [{ wisp: `${wsProtocol}//${location.host}/wisp/` }];
        },
        type: 'wisp'
    },
    // Fallback 1: External Bare server
    externalBare: {
        name: 'External Bare Server',
        module: '/baremod/index.mjs',
        getArgs: () => ['https://aluu.xyz/bare/'],
        type: 'bare'
    },
    // Fallback 2: External Wisp via epoxy
    wisp: {
        name: 'External Wisp Server',
        module: '/epoxy/index.mjs',
        getArgs: () => [{ wisp: 'wss://anura.pro/' }],
        type: 'wisp'
    }
};

// Fallback order for automatic retry
const FALLBACK_ORDER = ['localBare', 'localWisp', 'externalBare', 'wisp'];

// Global state
let bareMuxConnection = null;
let scramjetController = null;
let currentTransport = null;
let connectionReady = false;
let initializationPromise = null;

/**
 * Status callback for UI updates
 */
let statusCallback = (message, type) => console.log(`[Proxy] ${message}`);

/**
 * Set the status callback for UI updates
 */
function setStatusCallback(callback) {
    if (typeof callback === 'function') {
        statusCallback = callback;
    }
}

/**
 * Log status update
 */
function updateStatus(message, type = 'info') {
    console.log(`[Proxy ${type}] ${message}`);
    statusCallback(message, type);
}

/**
 * Wait for required scripts to load
 */
function waitForScripts(timeout = 10000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();

        function check() {
            // Check if BareMux is available
            if (typeof BareMux !== 'undefined' &&
                typeof BareMux.BareMuxConnection !== 'undefined') {
                resolve();
                return;
            }

            if (Date.now() - startTime > timeout) {
                reject(new Error('Timeout waiting for BareMux to load'));
                return;
            }

            setTimeout(check, 50);
        }

        check();
    });
}

/**
 * Initialize BareMux connection with retry logic
 */
async function initBareMux(retries = 3) {
    if (bareMuxConnection) {
        return bareMuxConnection;
    }

    await waitForScripts();

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            updateStatus(`Initializing BareMux (attempt ${attempt}/${retries})...`);
            bareMuxConnection = new BareMux.BareMuxConnection("/baremux/worker.js");

            // Wait a moment for SharedWorker to initialize
            await new Promise(r => setTimeout(r, 100));

            updateStatus('BareMux initialized successfully', 'success');
            return bareMuxConnection;
        } catch (err) {
            console.error(`BareMux init attempt ${attempt} failed:`, err);
            if (attempt === retries) {
                throw new Error(`Failed to initialize BareMux after ${retries} attempts: ${err.message}`);
            }
            await new Promise(r => setTimeout(r, 500 * attempt));
        }
    }
}

/**
 * Initialize Scramjet controller
 */
function initScramjet() {
    if (scramjetController) {
        return scramjetController;
    }

    try {
        if (typeof $scramjetLoadController !== 'undefined') {
            const { ScramjetController } = $scramjetLoadController();
            scramjetController = new ScramjetController({
                files: {
                    wasm: '/scram/scramjet.wasm.wasm',
                    all: '/scram/scramjet.all.js',
                    sync: '/scram/scramjet.sync.js',
                },
            });
            scramjetController.init();
            updateStatus('Scramjet initialized', 'success');
            return scramjetController;
        }
    } catch (e) {
        console.warn('Scramjet not available:', e);
    }

    return null;
}

/**
 * Test if a transport is working
 */
async function testTransport(transportKey, timeout = 5000) {
    const transport = TRANSPORTS[transportKey];
    if (!transport) return false;

    try {
        // For Bare servers, test the endpoint
        if (transport.type === 'bare') {
            const args = transport.getArgs();
            const bareUrl = args[0];

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            try {
                const response = await fetch(bareUrl, {
                    signal: controller.signal,
                    mode: 'cors'
                });
                clearTimeout(timeoutId);
                return response.ok;
            } catch (e) {
                clearTimeout(timeoutId);
                return false;
            }
        }

        // For Wisp, we assume it's available (can't easily test WebSocket)
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Set transport with automatic fallback
 */
async function setTransportWithFallback(preferredTransport = null, customUrl = null) {
    if (!bareMuxConnection) {
        await initBareMux();
    }

    // If custom URL provided, use appropriate transport
    if (customUrl) {
        try {
            if (customUrl.startsWith('wss://') || customUrl.startsWith('ws://')) {
                updateStatus(`Setting custom Wisp transport: ${customUrl}`);
                await bareMuxConnection.setTransport('/epoxy/index.mjs', [{ wisp: customUrl }]);
            } else {
                updateStatus(`Setting custom Bare transport: ${customUrl}`);
                await bareMuxConnection.setTransport('/baremod/index.mjs', [customUrl]);
            }
            currentTransport = 'custom';
            connectionReady = true;
            return true;
        } catch (err) {
            updateStatus(`Custom transport failed: ${err.message}`, 'warn');
            // Continue to fallback logic
        }
    }

    // Try transports in fallback order
    const order = preferredTransport
        ? [preferredTransport, ...FALLBACK_ORDER.filter(t => t !== preferredTransport)]
        : FALLBACK_ORDER;

    for (const transportKey of order) {
        const transport = TRANSPORTS[transportKey];
        if (!transport) continue;

        updateStatus(`Trying ${transport.name}...`);

        // Test if transport is reachable
        const isAvailable = await testTransport(transportKey);
        if (!isAvailable && transport.type === 'bare') {
            updateStatus(`${transport.name} not reachable, skipping`, 'warn');
            continue;
        }

        try {
            const args = transport.getArgs();
            await bareMuxConnection.setTransport(transport.module, args);

            currentTransport = transportKey;
            connectionReady = true;
            updateStatus(`Connected via ${transport.name}`, 'success');
            return true;
        } catch (err) {
            updateStatus(`${transport.name} failed: ${err.message}`, 'warn');
            continue;
        }
    }

    throw new Error('All transports failed. Please check your connection.');
}

/**
 * Register UV service worker with retry
 */
async function registerUVServiceWorker(retries = 3) {
    if (!navigator.serviceWorker) {
        throw new Error('Service workers not supported');
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            updateStatus(`Registering UV service worker (attempt ${attempt}/${retries})...`);

            const registration = await navigator.serviceWorker.register('/uv/sw.js', {
                scope: __uv$config.prefix
            });

            // Wait for the service worker to be ready
            if (registration.installing) {
                await new Promise((resolve, reject) => {
                    const sw = registration.installing;
                    sw.addEventListener('statechange', () => {
                        if (sw.state === 'activated') resolve();
                        if (sw.state === 'redundant') reject(new Error('SW became redundant'));
                    });
                    // Timeout after 10 seconds
                    setTimeout(() => resolve(), 10000);
                });
            }

            updateStatus('UV service worker ready', 'success');
            return registration;
        } catch (err) {
            console.error(`SW registration attempt ${attempt} failed:`, err);
            if (attempt === retries) {
                throw new Error(`Failed to register service worker: ${err.message}`);
            }
            await new Promise(r => setTimeout(r, 500 * attempt));
        }
    }
}

/**
 * Full proxy initialization
 * Call this before navigating to proxied content
 */
async function initializeProxy(options = {}) {
    const {
        backend = 'ultraviolet',
        customServer = null,
        onStatus = null,
        preferWisp = false  // For games, Wisp can be better
    } = options;

    // Prevent multiple simultaneous initializations
    if (initializationPromise) {
        return initializationPromise;
    }

    if (onStatus) {
        setStatusCallback(onStatus);
    }

    initializationPromise = (async () => {
        try {
            updateStatus('Starting proxy initialization...');

            // Initialize BareMux
            await initBareMux();

            // Set up transport with fallbacks
            // For games, prefer Wisp if requested
            const preferredTransport = preferWisp ? 'localWisp' : null;
            await setTransportWithFallback(preferredTransport, customServer);

            if (backend === 'scramjet') {
                // Initialize Scramjet - it has its own service worker
                updateStatus('Initializing Scramjet...');
                const controller = initScramjet();
                if (!controller) {
                    throw new Error('Failed to initialize Scramjet controller');
                }
                console.log('[Proxy success] Scramjet initialized');
            } else {
                // Only register UV service worker for Ultraviolet backend
                await registerUVServiceWorker();
            }

            updateStatus('Proxy ready!', 'success');
            return true;
        } catch (err) {
            updateStatus(`Initialization failed: ${err.message}`, 'error');
            throw err;
        } finally {
            initializationPromise = null;
        }
    })();

    return initializationPromise;
}

/**
 * Navigate to a URL using Ultraviolet
 */
async function navigateUV(url, options = {}) {
    const { newTab = false, iframe = null } = options;

    if (!connectionReady) {
        await initializeProxy(options);
    }

    const encodedUrl = __uv$config.prefix + __uv$config.encodeUrl(url);

    if (iframe) {
        iframe.src = encodedUrl;
        return iframe;
    } else if (newTab) {
        window.open(encodedUrl, '_blank');
    } else {
        location.href = encodedUrl;
    }

    return encodedUrl;
}

/**
 * Navigate to a URL using Scramjet
 */
async function navigateScramjet(url, container = document.body) {
    if (!scramjetController) {
        initScramjet();
    }

    if (!scramjetController) {
        throw new Error('Scramjet not available');
    }

    if (!connectionReady) {
        await initializeProxy({ backend: 'scramjet' });
    }

    const frame = scramjetController.createFrame();
    frame.frame.style.cssText = 'width:100%;height:100%;border:none;position:fixed;top:0;left:0;';
    container.appendChild(frame.frame);
    frame.go(url);

    return frame;
}

/**
 * Attempt to recover from a connection error
 * Call this when you detect proxy failures
 */
async function recoverConnection() {
    updateStatus('Attempting connection recovery...', 'warn');

    connectionReady = false;

    // Find next transport in fallback order
    const currentIndex = FALLBACK_ORDER.indexOf(currentTransport);
    const nextTransports = FALLBACK_ORDER.slice(currentIndex + 1);

    if (nextTransports.length === 0) {
        // Reset and try from beginning
        nextTransports.push(...FALLBACK_ORDER);
    }

    for (const transportKey of nextTransports) {
        try {
            await setTransportWithFallback(transportKey);
            updateStatus('Connection recovered!', 'success');
            return true;
        } catch (e) {
            continue;
        }
    }

    throw new Error('Failed to recover connection');
}

/**
 * Get current connection status
 */
function getConnectionStatus() {
    return {
        ready: connectionReady,
        transport: currentTransport,
        transportName: currentTransport ? (TRANSPORTS[currentTransport]?.name || 'Custom') : null,
        hasBareMux: !!bareMuxConnection,
        hasScramjet: !!scramjetController
    };
}

/**
 * Get proxy settings from localStorage
 */
function getProxySettings() {
    try {
        const saved = localStorage.getItem('endis_proxy_settings');
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.error('Failed to load proxy settings:', e);
    }
    return {
        backend: 'ultraviolet',
        transport: 'bare',
        customServer: '',
        useCustomServer: false
    };
}

/**
 * Save proxy settings to localStorage
 */
function saveProxySettings(settings) {
    try {
        localStorage.setItem('endis_proxy_settings', JSON.stringify(settings));
    } catch (e) {
        console.error('Failed to save proxy settings:', e);
    }
}

// Export for use in other scripts
window.ProxyUtils = {
    initializeProxy,
    navigateUV,
    navigateScramjet,
    recoverConnection,
    getConnectionStatus,
    getProxySettings,
    saveProxySettings,
    setStatusCallback,
    initBareMux,
    initScramjet,
    setTransportWithFallback,
    registerUVServiceWorker,
    TRANSPORTS,
    FALLBACK_ORDER
};
