import { getServerSession } from "next-auth/next";
import { User, createUser, getUser, updateUser } from "@/utils/mongoDbHelpers";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");
  if (!username) {
    Response;
    return Response.json(
      { error: "'username' cannot be empty" },
      {
        status: 400,
      }
    );
  }

  try {
    return Response.json(await getUser(username));
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Serrver error." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }

  const user: User = await request.json();

  if (!user.username) {
    Response;
    return Response.json(
      { error: "'username' cannot be empty" },
      {
        status: 400,
      }
    );
  }

  try {
    return Response.json(await createUser(user));
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Serrver error." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }

  const user: User = await request.json();

  if (!user.username) {
    Response;
    return Response.json(
      { error: "'username' cannot be empty" },
      {
        status: 400,
      }
    );
  }

  try {
    return Response.json(await updateUser(user));
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Serrver error." }, { status: 500 });
  }
}
