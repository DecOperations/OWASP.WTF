# Fixture for OWASP A10:2021 — SSRF (Python)
# Triggers: A10-SSRF (high)
# Used only by packages/cli/test/native-rules.test.mjs

import requests
import urllib.request

# 1. requests with user input
requests.get(request.args.get('url'))
requests.post(request.form['url'])

# 2. urllib with user input
urllib.request.urlopen(request.json()['url'])
