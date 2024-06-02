import StreamWatcher from "./StreamWatcher";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { User, getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import React from "react";

export default async function Dashboard() {
  const session: any = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin");
  }

  return (
    <>
      <h1>Dashboard</h1>
      <StreamWatcher user={session.user} token={session.accessToken || ""} />
    </>
  );
}
