import StreamWatcher from "./StreamWatcher";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import React from "react";
import Cookies from "js-cookie";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin");
  }

  return (
    <>
      <h1>Dashboard</h1>
      <StreamWatcher />
    </>
  );
}
