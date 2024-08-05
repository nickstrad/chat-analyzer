import { runLiveStreamPrompt } from "@/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/auth";

const CHECK_API_SESSION = /true/i.test(process.env.CHECK_API_SESSION ?? "");

export async function POST(req: Request) {
  if (CHECK_API_SESSION) {
    const session = await getServerSession(authOptions);

    if (!session) {
      return Response.json({ error: "Not signed in" }, { status: 401 });
    }
  }
  console.log("hereee");
  try {
    const comments = await req.json();
    const data = await runLiveStreamPrompt(comments);
    return Response.json(data);
  } catch (err) {
    console.error(err);
    return Response.json({ error: err }, { status: 500 });
  }
}
