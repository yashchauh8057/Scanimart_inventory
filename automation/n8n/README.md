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

## Free production deployment on Google Cloud

The ScaniMart API can remain on Render while n8n runs on a Google Cloud Always Free
`e2-micro` VM. This is preferable to a Render free n8n service because the VM keeps
the n8n database on persistent disk and does not sleep during webhook delivery.

1. Create an Ubuntu `e2-micro` Compute Engine VM in an eligible Always Free region.
2. Allow TCP port `5678` temporarily, or put n8n behind a reverse proxy with HTTPS.
3. Install Docker and Docker Compose on the VM.
4. Copy `docker-compose.gcp.yml` and create a `.env` beside it with:

   ```env
   WEBHOOK_URL=https://your-n8n-domain.example/
   N8N_EDITOR_BASE_URL=https://your-n8n-domain.example
   N8N_ENCRYPTION_KEY=generate-a-long-random-secret
   N8N_BASIC_AUTH_USER=admin
   N8N_BASIC_AUTH_PASSWORD=use-a-strong-password
   AUTOMATION_TIME_ZONE=Asia/Kolkata
   ```

5. Start n8n with `docker compose -f docker-compose.gcp.yml up -d`.
6. Open the n8n editor, import `../../customer-email-workflows.json`, attach the
   SMTP credential to both email nodes, replace `store@example.com`, and activate
   the workflow.
7. In the Render API service, set:

   ```text
   N8N_CUSTOMER_EMAIL_WEBHOOK_URL=https://your-n8n-domain.example/webhook/customer-email-event
   PUBLIC_BASE_URL=https://your-render-api.onrender.com
   AUTOMATION_TOKEN=<the same strong token used by n8n>
   ```

The API sends n8n a verified exit event containing the customer email, receipt,
items, and bill URL. n8n does not need Firebase Admin credentials, which keeps the
Firebase service account out of the automation host.

## Firebase Cloud Function alternative

If n8n is not required, this repository includes a Firebase HTTPS Function that
reads the verified receipt directly from Firebase and sends the thank-you email:
`functions/index.js`.

From the repository root:

```bash
npm install -g firebase-tools
firebase login
firebase use YOUR_FIREBASE_PROJECT_ID
cd functions && npm install && cd ..
firebase deploy --only functions:sendCustomerThankYouEmail
```

Before deploying, copy `functions/.env.example` to `functions/.env` and set the
Firebase database URL, the same `AUTOMATION_TOKEN` used by Render, and SMTP
credentials. Gmail requires a 2-Step Verification app password; do not use the
normal Gmail password. Firebase Functions requires the Blaze billing plan, but
the function may remain within the provider's monthly no-cost quota for a small
project. After deployment, set the returned HTTPS URL as
`CUSTOMER_EMAIL_FUNCTION_URL` in Render. When this variable is present, the API
calls the Firebase Function after exit verification and n8n is not used.

## Render deployment

The repository Blueprint defines a separate `scanimart-n8n` Docker web service with a persistent n8n data disk. It currently uses Render's paid `starter` plan. Do not change it to Render's free plan for production: free services sleep and do not provide the persistent disk needed by n8n. Use the Google Cloud deployment above for a fully free n8n host. Never commit n8n passwords, SMTP credentials, Firebase keys, or API tokens.

Stop the service with `docker compose down`. The named `n8n_data` volume preserves n8n's local database and credentials.
