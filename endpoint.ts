// A) Setup Auth0 log streaming as follows:
// 1. Go to your Auth0 dashboard and navigate to Monitoring > Streams.
// 2. Click on the "Create Stream" button.
// 3. Select "Custom Webhook" as the stream type.
// 4. Enter a name for the stream.
// 5. Enter the URL of this endpoint as the "Payload URL".
// 6. Select "JSON Object" as the "Content Format".
// 7. Select all categories you want to forward to Discord in "Filter by Category".
// 8. Click on the "Create" button.

// B) Get the Auth0 log base URL as follows:
// 1. Go to your Auth0 dashboard.
// 2. Navigate to Monitoring > Logs.
// 3. Click on any log entry and copy the URL (excluding the log ID).
// Example URL: https://manage.auth0.com/dashboard/us/dev-jcvyvq5be47ork05/logs/
const AUTH0_LOG_BASE_URL = "";

// C) Get the Discord Webhook URL as follows:
// 1. Go to your Discord server settings.
// 2. Navigate to Integrations > Webhooks.
// 3. Create a new webhook and copy its URL.
// Example URL: https://discord.com/api/webhooks/1147473308309262346/OfZnSAleU4UHetaYhI1_YAhPmrE3vEhIebewYRB6Pa5SWI1YWlU4GAEOBGKwFblXNwnH/
const DISCORD_WEBHOOK_URL = "";

type StreamRequest = {
  body: {
    logs: {
      log_id: string;
      data: {
        date: string;
        type: string;
        description: string;
        client_id: string;
        client_name: string;
        ip: string;
        user_agent: string;
        user_id: string;
        user_name: string;
        log_id: string;
      };
    }[];
  };
};

function apiHandler(request: StreamRequest) {
  const { logs } = request.body;

  const discordMessage = logs
    .map((entry) => {
      const description =
        entry.data.description ?? "Could not find a description.";
      const type = entry.data.type;
      const userEmail = entry.data.user_name;
      const url = `${AUTH0_LOG_BASE_URL}${entry.log_id}`;

      return `Description: ${description}\nType: ${type}\nUser email: ${userEmail}\nUrl: ${url}`;
    })
    .join("\n\n");

  return fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: discordMessage,
    }),
  });
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
  await apiHandler(req);
  return res.status(200).json({ success: true });
}
