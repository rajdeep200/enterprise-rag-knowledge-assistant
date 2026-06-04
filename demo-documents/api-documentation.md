# Acme SaaS — API Documentation

## Authentication
All API requests must include a bearer token in the `Authorization` header:
`Authorization: Bearer <API_KEY>`. API keys are generated from the developer settings page.

## Rate Limits
The API enforces the following rate limits:
- **Free plan:** 60 requests per minute.
- **Pro plan:** 600 requests per minute.
- **Enterprise plan:** 6,000 requests per minute.

If a client exceeds the limit, the API returns HTTP 429 (Too Many Requests) with a
`Retry-After` header indicating how many seconds to wait before retrying.

## Pagination
List endpoints return up to 50 items per page by default (maximum 200). Use the `cursor`
query parameter returned in `next_cursor` to fetch subsequent pages.

## Errors
Errors are returned as JSON with an `error.code` and `error.message`. Common codes:
- `401 unauthorized` — missing or invalid API key.
- `404 not_found` — the requested resource does not exist.
- `429 rate_limited` — too many requests.

## Webhooks
Webhooks are delivered with an HMAC-SHA256 signature in the `X-Acme-Signature` header.
Verify the signature using your webhook signing secret before processing the payload.
