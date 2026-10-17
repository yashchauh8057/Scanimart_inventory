# Scanimart n8n automations

This folder runs n8n locally with Docker and connects it to the Scanimart API. The backend remains the source of truth for payment, inventory, customer consent, and Firebase data.

For a single-file import, use `../scanimart-full-automation.json` from the `automation/` folder. It contains the core order, low-stock, daily-report, WhatsApp, duplicate-prevention, and error-alert branches in one workflow. The modular files below remain available when you prefer separate workflows.

## Start

1. Install and launch Docker Desktop for macOS.
2. Copy `.env.example` to `.env` and set the same `AUTOMATION_TOKEN` used by the API plus a strong n8n password.
3. Start n8n:

   ```bash
   cd automation/n8n
   docker compose up -d
   ```

4. Open http://localhost:5678 and sign in with the credentials from `.env`.
5. Import these workflows from the `workflows/` directory and activate only after credentials and environment variables are configured:

   - `scanimart-order-processing.json` — authenticated order webhook, trusted payment verification, idempotent processing, and notification handoff.
   - `scanimart-whatsapp-notifications.json` — opt-in guard, duplicate-message claim, and official WhatsApp Cloud API template delivery.
   - `scanimart-low-stock.json` — 30-minute inventory check, condition-based deduplication, and administrator notification.
   - `scanimart-daily-analytics.json` — verified daily revenue and order metrics with duplicate-report protection.
   - `scanimart-analytics-chart.json` — local HTML/SVG chart at `/webhook/scanimart/analytics/chart`.
   - `scanimart-operations-agent.json` — DeepSeek-powered allowlisted operations agent at `/webhook/scanimart/agent`.
   - `scanimart-error-monitoring.json` — catches failed n8n executions and alerts the administrator.

The customer email workflow is in the repository root at `../../customer-email-workflows.json`. Import it separately, attach your SMTP credential to both email nodes, verify the sender address, and publish it. Its production webhook path is `/webhook/customer-email-event`. Point the API variable `N8N_CUSTOMER_EMAIL_WEBHOOK_URL` at the public n8n URL, for example `https://your-n8n-host.example/webhook/customer-email-event`.

Configure `SCANIMART_API_URL`, `SCANIMART_AUTOMATION_TOKEN`, `SCANIMART_ADMIN_RECIPIENT`, `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL`, `DEEPSEEK_MODEL`, `WHATSAPP_PHONE_NUMBER_ID`, and `WHATSAPP_ACCESS_TOKEN` in the container environment. Create and approve the WhatsApp templates referenced by the workflow before activating customer messaging.

### Multiple-customer abandoned-cart reminders

Store each customer in Firebase `customers/{customerId}` with `phone` and `whatsappOptIn: true`. Store each open cart in `abandonedCarts/{cartId}` with `customerId`, `items`, `status: "active"`, and `lastUpdatedAt`. The abandoned-cart endpoint joins carts to customer records, returns every eligible customer, and n8n processes each returned item separately. The notification claim key is customer/cart-specific, so one customer cannot receive duplicate reminders while other customers continue normally. Never hardcode customer phone numbers in n8n.

   After activating the chart workflow, open `http://localhost:5678/webhook/scanimart/analytics/chart` to view the local sales chart.

## Required manual setup

1. In the application `.env`, set one strong shared `AUTOMATION_TOKEN` and `PUBLIC_BASE_URL`. Restart the ScaniMart API after changing it.
2. Copy this folder's `.env.example` to `.env`, then set the same `AUTOMATION_TOKEN`, a strong n8n password, and the admin WhatsApp number in international format.
3. In Meta Business Manager, create and approve the WhatsApp templates `scanimart_order_confirmation`, `scanimart_order_update`, and `low_stock_alert`. Set the Cloud API phone number ID and access token in the n8n environment. Never put these values in workflow JSON or Git.
4. Import the JSON files into n8n and configure the OpenAI Chat Model credential for the AI Agent. For DeepSeek, use its OpenAI-compatible base URL and model, or use the Operations Agent workflow which calls the DeepSeek API from environment variables.
5. Activate the webhook, schedule, notification, and error workflows only after credentials are present. The backend verifies Razorpay/cash payment status; n8n never trusts a frontend payment-success message.

The initial three production paths are order confirmation, low-stock alerts, and WhatsApp integration. Recommendations, payment-failure/refund events, and broader support automation can be added through the same authenticated webhook and notification-claim contract without direct Firebase access.

The API must be running on the host at `http://localhost:3000`. Inside Docker it is reached through `host.docker.internal`. The low-stock workflow checks every 30 minutes; the daily report runs at 20:00 India time. The backend still owns Telegram delivery for the legacy endpoints, while n8n owns the modular WhatsApp workflows.

For production, replace the local Docker URL with a public n8n deployment. The local Docker Compose file is intended for development and must not be exposed directly to the internet without HTTPS, authentication, persistent storage, and a reverse proxy.

## Render deployment

The repository Blueprint defines a separate `scanimart-n8n` Docker web service with a persistent n8n data disk. Sync `render.yaml` in the Render Dashboard, provide the n8n basic-auth username and password when prompted, and wait for the service health check to pass. Open the generated HTTPS URL, import `../../customer-email-workflows.json`, configure SMTP on both email nodes, and activate the workflow. In the ScaniMart API service, set `N8N_CUSTOMER_EMAIL_WEBHOOK_URL` to the n8n URL ending in `/webhook/customer-email-event` and set `PUBLIC_BASE_URL` to the API URL. Never commit n8n passwords, SMTP credentials, Firebase keys, or API tokens.

Stop the service with `docker compose down`. The named `n8n_data` volume preserves n8n's local database and credentials.
