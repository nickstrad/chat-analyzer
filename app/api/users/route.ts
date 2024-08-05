import { getServerSession } from "next-auth/next";
import {
  User,
  connectDB,
  createUser,
  deleteUser,
  getUser,
  updateUser,
} from "@/utils";
import { validateUserAgainstSession } from "@/utils/auth";

export async function GET(request: Request) {
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
    if (!validateUserAgainstSession(username)) {
      return Response.json(
        { error: `cannot make call for ${username}` },
        {
          status: 403,
        }
      );
    }
    await connectDB();
    return Response.json(await getUser(username));
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Serrver error." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user: User = await request.json();

  if (!user.username) {
    return Response.json(
      { error: "'username' cannot be empty" },
      {
        status: 400,
      }
    );
  }

  try {
    if (!validateUserAgainstSession(user.username)) {
      return Response.json(
        { error: `cannot make call for ${user.username}` },
        {
          status: 403,
        }
      );
    }
    await connectDB();
    return Response.json(await createUser(user));
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Serrver error." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
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
    if (!validateUserAgainstSession(user.username)) {
      return Response.json(
        { error: `cannot make call for ${user.username}` },
        {
          status: 403,
        }
      );
    }
    await connectDB();
    return Response.json(await updateUser(user));
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Serrver error." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
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
    if (!validateUserAgainstSession(user.username)) {
      return Response.json(
        { error: `cannot make call for ${user.username}` },
        {
          status: 403,
        }
      );
    }
    await connectDB();
    return Response.json(await deleteUser(user.username));
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Serrver error." }, { status: 500 });
  }
}
