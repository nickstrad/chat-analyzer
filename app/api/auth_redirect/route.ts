import queryString from "query-string";
import { redirect } from "next/navigation";
import * as changeCase from "change-case";

export async function GET(request: Request) {
  console.log("in auth redirect");

  const queryParams = request.url.split("?")[1];
  const parsed = queryString.parse(queryParams);

  if (!parsed.code) {
    return Response.json({ login: false });
  }

  const baseURL = "https://id.twitch.tv/oauth2/token?";
  const params: { [key: string]: string } = {
    client_id: process.env.NEXT_PUBLIC_TWITCH_BOT_CLIENT_ID!,
    client_secret: process.env.NEXT_PUBLIC_TWITCH_BOT_CLIENT_SECRET!,
    grant_type: "authorization_code",
    redirect_uri: "http://localhost:3000/api/auth_redirect",
    code: parsed.code as any,
  };

  const paramsStr = Object.keys(params).reduce((acc: string, cur: string) => {
    if (!acc) {
      return `${cur}=${params[cur]}`;
    }
    acc += `&${cur}=${params[cur]}`;
    return acc;
  }, "");

  const fullURL = `${baseURL}${paramsStr}`;

  const data = await fetch(fullURL, { method: "POST" });
  const json = await data.json();

  let convertedCaseJSON = Object.entries(json).reduce((acc, [key, val]) => {
    acc[changeCase.camelCase(key)] = val;
    return acc;
  }, {} as any);

  console.log(convertedCaseJSON);
  const encoded = btoa(JSON.stringify(convertedCaseJSON));

  redirect(`/auth?data=${encoded}`);
}
