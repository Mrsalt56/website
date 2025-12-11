"use strict";
/**
 * URL Rewriting Utility
 * Makes URLs look clean in the address bar using History API
 */

const URL_MAPPINGS = {
    '/nowgg.html': '/ngg',
    '/g.html': '/g',
    '/settings.html': '/settings',
    '/apps.html': '/apps',
    '/games.html': '/games',
    '/embed.html': '/embed',
    '/index.html': '/',
    '/a.html': '/a',
    '/r.html': '/r',
    '/credits.html': '/credits',
    '/privacy-policy.html': '/privacy',
    '/donate.html': '/donate',
    '/contact.html': '/contact'
};

/**
 * Rewrite current URL to clean format
 */
function rewriteUrl() {
    const currentPath = window.location.pathname;
    const search = window.location.search;
    const hash = window.location.hash;

    // Check if current path needs rewriting
    for (const [oldPath, newPath] of Object.entries(URL_MAPPINGS)) {
        if (currentPath === oldPath || currentPath.endsWith(oldPath)) {
            const cleanUrl = newPath + search + hash;
            window.history.replaceState(null, '', cleanUrl);
            return;
        }
    }
}

/**
 * Get clean URL for a path
 */
function getCleanUrl(path) {
    for (const [oldPath, newPath] of Object.entries(URL_MAPPINGS)) {
        if (path === oldPath || path.endsWith(oldPath)) {
            return newPath;
        }
    }
    return path;
}

/**
 * Update all internal links to use clean URLs
 */
function updateLinks() {
    document.querySelectorAll('a[href]').forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('http') && !href.startsWith('//')) {
            for (const [oldPath, newPath] of Object.entries(URL_MAPPINGS)) {
                if (href === oldPath || href.startsWith(oldPath + '?') || href.startsWith(oldPath + '#')) {
                    const newHref = href.replace(oldPath, newPath);
                    link.setAttribute('href', newHref);
                }
            }
        }
    });
}

// Execute URL rewrite IMMEDIATELY (before page renders)
// This ensures the URL bar shows clean paths right away
rewriteUrl();

// Update links after DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateLinks);
} else {
    updateLinks();
}

// Export for use elsewhere
window.UrlRewrite = {
    rewriteUrl,
    getCleanUrl,
    updateLinks,
    URL_MAPPINGS
};
