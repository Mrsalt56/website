export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Only respond on /api/visitors-week
    if (url.pathname !== "/api/visitors-week") {
      return new Response("Not found", { status: 404 });
    }

    // Required env vars:
    // - API_TOKEN (a Cloudflare API token with Account Analytics:Read + access to this zone)
    // - ZONE_TAG  (your zone id)
    // Optional:
    // - HOSTNAME (ex: "mathhelps.org") to count only that host

    const end = new Date();
    const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Cloudflare examples use UTC with Z
    const iso = (d) => d.toISOString();

    const query = `
      query VisitorsThisWeek($zoneTag: string, $filter: filter) {
        viewer {
          zones(filter: { zoneTag: $zoneTag }) {
            httpRequestsAdaptiveGroups(limit: 1000, filter: $filter) {
              sum {
                visits
              }
              dimensions {
                datetimeHour
              }
            }
          }
        }
      }
    `;

    const filter = {
      datetime_geq: iso(start),
      datetime_lt: iso(end),
      requestSource: "eyeball",
    };

    if (env.HOSTNAME) filter.clientRequestHTTPHost = env.HOSTNAME;

    const gqlRes = await fetch("https://api.cloudflare.com/client/v4/graphql", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.API_TOKEN}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: { zoneTag: env.ZONE_TAG, filter },
      }),
    });

    if (!gqlRes.ok) {
      return new Response(JSON.stringify({ visitors: null, error: "GraphQL request failed" }), {
        status: 502,
        headers: { "content-type": "application/json" },
      });
    }

    const payload = await gqlRes.json();

    const groups = payload?.data?.viewer?.zones?.[0]?.httpRequestsAdaptiveGroups || [];
    const totalVisits = groups.reduce((acc, g) => acc + (g?.sum?.visits || 0), 0);

    return new Response(JSON.stringify({ visitors: totalVisits }), {
      headers: {
        "content-type": "application/json",
        // cache for 10 minutes at the edge
        "cache-control": "public, max-age=600",
      },
    });
  },
};
