// Fixture for OWASP A10:2021 — SSRF
// Triggers: A10-SSRF (high)
// Used only by packages/cli/test/native-rules.test.mjs

declare const req: { params: { url: string }; query: { endpoint: string }; body: { imageUrl: string; webhook: string } };
declare const axios: { get(url: string): Promise<unknown>; post(url: string): Promise<unknown> };
declare const http: { get(url: string): Promise<unknown> };
declare const https: { get(url: string): Promise<unknown> };
declare const request: (url: string) => Promise<unknown>;

// 1. fetch with user input
fetch(req.params.url);

// 2. axios with user input
axios.get(req.query.endpoint);
axios.post(req.body.imageUrl);

// 3. http/https.get with user input
http.get(req.params.url);
https.get(req.query.endpoint);

// 4. request library with user input
request(req.body.webhook);
