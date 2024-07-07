import { getServerSession } from "next-auth/next";
import {
  SaveQuestionsParams,
  connectDB,
  getAllSavedQuestions,
  getSavedQuestionsForKey,
  saveQuestions,
} from "@/utils";
import { authOptions } from "../auth/[...nextauth]/route";

const CHECK_API_SESSION = /true/i.test(process.env.API_TESTING ?? "");

export async function GET(request: Request) {
  if (CHECK_API_SESSION) {
    const session = await getServerSession(authOptions);

    if (!session) {
      return Response.json({ error: "Not signed in" }, { status: 401 });
    }
  }

  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");
  if (!username) {
    return Response.json(
      { error: "'username' cannot be empty" },
      {
        status: 400,
      }
    );
  }

  const savedQuestionsMapKey = searchParams.get("savedQuestionsMapKey");

  try {
    await connectDB();
    if (savedQuestionsMapKey) {
      return Response.json(
        await getSavedQuestionsForKey({ username, savedQuestionsMapKey })
      );
    }
    return Response.json(await getAllSavedQuestions(username));
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Serrver error." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (CHECK_API_SESSION) {
    const session = await getServerSession(authOptions);

    if (!session) {
      return Response.json({ error: "Not signed in" }, { status: 401 });
    }
  }

  const {
    username = "",
    savedQuestionsMapKey = "",
    questions = [],
  }: SaveQuestionsParams = await request.json();

  if (!username) {
    Response;
    return Response.json(
      { error: "'username' cannot be empty" },
      {
        status: 400,
      }
    );
  }

  if (!savedQuestionsMapKey) {
    Response;
    return Response.json(
      { error: "'savedQuestionsMapKey' cannot be empty" },
      {
        status: 400,
      }
    );
  }
  if (!questions.length) {
    Response;
    return Response.json(
      { error: "'questions' cannot be empty" },
      {
        status: 400,
      }
    );
  }

  try {
    await connectDB();

    return Response.json(
      await saveQuestions({
        username,
        questions,
        savedQuestionsMapKey,
      })
    );
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Serrver error." }, { status: 500 });
  }
}
