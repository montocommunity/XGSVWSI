// This value needs to match the CRON interval in the GitHub Actions workflow file.
const CRON_INTERVAL_IN_MINUTES = 60 * 3;

// Get the Discord Webhook URL as follows:
// 1. Go to your Discord server settings.
// 2. Navigate to Integrations > Webhooks.
// 3. Create a new webhook and copy its URL.
// Example URL: https://discord.com/api/webhooks/1147473308309262346/OfZnSAleU4UHetaYhI1_YAhPmrE3vEhIebewYRB6Pa5SWI1YWlU4GAEOBGKwFblXNwnH/
const DISCORD_WEBHOOK_URL =
  "https://discord.com/api/webhooks/1147473308309262346/OfZnSAleU4UHetaYhI1_YAhPmrE3vEhIebewYRB6Pa5SWI1YWlU4GAEOBGKwFblXNwnH";

// Get the Auth0 log base URL as follows:
// 1. Go to your Auth0 dashboard.
// 2. Navigate to Monitoring > Logs.
// 3. Click on any log entry and copy the URL (excluding the log ID).
// Example URL: https://manage.auth0.com/dashboard/us/dev-jcvyvq5be47ork05/logs/
const AUTH0_LOG_BASE_URL =
  "https://manage.auth0.com/dashboard/us/dev-jcvyvq5be47ork05/logs/";

// Create a new Auth0 app as follows:
// 1. Go to your Auth0 dashboard.
// 2. Navigate to Applications > Applications.
// 3. Click on "Create Application".
// 4. Click on "Machine to Machine Application" and click "Create".
// 5. Select "Auth0 Management API".
// 6. Filter for "read:logs" and "read:logs_users" and enable them.
// 7. Click on "Authorize".
// 8. Check quickstart example and copy/paste its values here:
const TOKEN_URL = "https://dev-jcvyvq5be47ork05.us.auth0.com/oauth/token";
const CLIENT_ID = "ECBZJwmH9kCTWwdc27r3l2BbyyNNNIrf";
const CLIENT_SECRET =
  "WokueLtD92MFPgH-pjEjTV65A9JQJgKMMeJHUNcERgmD6vhcPRDgfDdcd1xmjUhw";
const AUDIENCE = "https://dev-jcvyvq5be47ork05.us.auth0.com/api/v2/";

// Error types to fetch from Auth0 logs.
// Can be adjusted as needed.
// https://auth0.com/docs/deploy-monitor/logs/log-event-type-codes
const ERROR_TYPES = [
  "f",
  "fapi",
  "fc",
  "fce",
  "fco",
  "fcoa",
  "fcp",
  "fcph",
  "fcpn",
  "fcpr",
  "fcpro",
  "fcu",
  "fd",
  "fdeac",
  "fdeaz",
  "fdecc",
  "fdu",
  "feacft",
  "feccft",
  "fede",
  "fens",
  "feoobft",
  "feotpft",
  "fepft",
  "fepotpft",
  "fercft",
  "fertft",
  "ferrt",
  "fi",
  "flo",
  "fn",
  "fp",
  "fs",
  "fsa",
  "fu",
  "fui",
  "fv",
  "fvr",
  "api_limit",
  "gd_auth_failed",
  "gd_auth_rejected",
  "gd_otp_rate_limit_exceed",
  "gd_recovery_failed",
  "gd_recovery_rate_limit_exceed",
  "gd_send_sms_failure",
  "gd_send_voice_failure",
  "gd_start_enroll_failed",
  "gd_webauthn_challenge_failed",
  "limit_mu",
  "limit_wc",
  "limit_sul",
];

type LogEntry = {
  date: string;
  type: string;
  description: string;
  connection_id: string;
  client_id: string;
  client_name: string;
  ip: string;
  user_agent: string;
  hostname: string;
  user_id: string;
  user_name: string;
  audience: string;
  scope: string | null;
  log_id: string;
  _id: string;
  isMobile: boolean;
};

async function apiHandler() {
  const logs = await fetchRecentErrorLogs();

  const discordMessages = logs.map((entry) => {
    const date = new Date(entry.date).toUTCString();
    const description = entry.description ?? "Could not find a description.";
    const type = entry.type;
    const userEmail = entry.user_name;
    const url = `${AUTH0_LOG_BASE_URL}${entry.log_id}`;

    return `Date: ${date}\nDescription: ${description}\nType: ${type}\nUser email: ${userEmail}\nUrl: ${url}`;
  });

  // Split up into multiple messages to avoid Discord character limit (2000 characters)
  for (let i = 0; i < discordMessages.length; i += 5) {
    const messages = discordMessages.slice(i, i + 5).join("\n\n");

    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: messages,
      }),
    });

    // wait 500ms to avoid Discord rate limit
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

async function fetchRecentErrorLogsRequest(token: string) {
  const url = `${AUDIENCE}logs`;

  const startTime = new Date(
    new Date().getTime() - CRON_INTERVAL_IN_MINUTES * 60 * 1000
  );

  const startTimeISO = startTime.toISOString();

  // See Auth0 docs for more info on query syntax:
  // https://auth0.com/docs/deploy-monitor/logs/log-search-query-syntax
  const query = `(type:${ERROR_TYPES.join(
    " OR type:"
  )}) AND date:[${startTimeISO} TO *]`;

  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };

  return fetch(`${url}?q=${encodeURIComponent(query)}&search_engine=v3`, {
    method: "GET",
    headers: headers,
  });
}

async function fetchRecentErrorLogs() {
  const token = await getNewAccessToken();
  const response = await fetchRecentErrorLogsRequest(token);
  return (await response.json()) as LogEntry[];
}

async function getNewAccessToken() {
  const url = TOKEN_URL;
  const headers = {
    "Content-Type": "application/json",
  };
  const body = JSON.stringify({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    audience: AUDIENCE,
    grant_type: "client_credentials",
  });

  const response = await fetch(url, {
    method: "POST",
    headers: headers,
    body: body,
  });

  const responseJson = (await response.json()) as { access_token: string };

  return responseJson.access_token;
}

// ************************************
// NextJs API route boilerplate below.
// Replace this with your own API route.
// ************************************
import { type NextApiResponse, type NextApiRequest } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // optional:
  // add a secret to your endpoint and check for it here
  // if (req.query.secret !== "my-secret") return res.status(401).json({ success: false });
  await apiHandler();
  return res.status(200).json({ success: true });
}

// ************************************
// GitHub Actions CRON job boilerplate below.
// Create a new file in .github/workflows/auth0-logs-to-discord.yml and add the following:
// ************************************

// name: Auth0 to Discord

// on:
//   schedule:
//     # For changing the schedule, see https://crontab.guru/examples.html
//     - cron: '0 */3 * * *' # Every 3 hours

// jobs:
//   make-request:
//     runs-on: ubuntu-latest

//     steps:
//     - name: Auth0 to Discord
//       run: |
//         curl -X GET "https://your-endpoint-url-here.com"
