# Acme SaaS — Product Support SOP

## Handling Failed Payments
When a customer reports a failed payment, support agents should follow this procedure:

1. **Verify the charge** — Check the billing dashboard to confirm whether the payment
   failed at the card network or due to insufficient funds.
2. **Notify the customer** — Send the standard "payment failed" email template, which
   includes a secure link to update the payment method.
3. **Retry window** — The system automatically retries a failed payment after 24 hours
   and again after 72 hours. Do not manually retry before the automatic retry runs.
4. **Grace period** — Customers keep full access for a 7-day grace period after the first
   failed payment. After 7 days, the account is downgraded to read-only.
5. **Escalation** — If the payment still fails after the grace period, escalate the ticket
   to the Billing team with the customer ID and a summary of attempted resolutions.

## Response Time Targets
- Priority 1 (service down): respond within 1 hour.
- Priority 2 (major feature broken): respond within 4 hours.
- Priority 3 (general question): respond within 1 business day.

## Refund Policy
Refunds for the current billing cycle may be issued within 14 days of charge. Refunds
beyond 14 days require manager approval.
