import StreamWatcher from "./StreamWatcher";
import { authOptions } from "@/utils/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import React from "react";

export default async function Dashboard() {
  const session: any = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin");
  }

  if (!session.user) {
    console.error("There is no user in the session");
  }

  if (!session.accessToken) {
    console.error("Unable to get necessary access token");
  }

  return <StreamWatcher user={session.user} token={session.accessToken} />;
}
