"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export default async function Auth() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const encodedString = searchParams.get("data");

  if (encodedString) {
    Cookies.set("twitch_token", atob(encodedString));
    router.push("/");
  }

  return (
    <>
      <h1>Auth</h1>
    </>
  );
}
