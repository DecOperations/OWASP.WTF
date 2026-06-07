// Deliberately clean fixture for A10 — must produce ZERO SSRF findings.
// Used only by packages/cli/test/native-rules.test.mjs

fetch('https://api.example.com/data');
axios.get('https://api.example.com/data');
axios.post('https://api.example.com/data');
http.get('https://api.example.com/data');
https.get('https://api.example.com/data');
request('https://api.example.com/data');
