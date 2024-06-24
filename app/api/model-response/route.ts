import { runLiveStreamPrompt } from "@/utils/promptHelper";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }

  if (!session.user) {
    console.error("session set but user isnt'.");
    return Response.json({ error: "session not configured" }, { status: 500 });
  }

  try {
    const comments = await req.json();
    const data = await runLiveStreamPrompt(comments);
    return Response.json({ data });
  } catch (err) {
    console.error(err);
    return Response.json({ data: [] });
  }
}
