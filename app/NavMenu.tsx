import Link from "next/link";
import Image from "next/image";
import { SignInButton, SignOutButton } from "@/components/buttons";
import AuthCheck from "@/components/AuthCheck";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";

export default async function NavMenu() {
  const session: any = await getServerSession(authOptions);

  return (
    <nav className="navbar bg-base-100">
      <div className="flex-1">
        <Link className="link link-hover" href="/">
          ChatWrangler
        </Link>
      </div>

      <div>
        {" "}
        {session?.user?.image ? (
          <li>
            <div className="avatar">
              <div className="w-8 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                <img src={session.user.image} />
              </div>
            </div>
          </li>
        ) : null}
      </div>
      <div className="flex-none">
        <ul className="menu menu-horizontal px-2">
          <li>
            <Link className="link link-hover" href="/about">
              About
            </Link>
          </li>
          <li>
            <SignInButton />
          </li>

          <li>
            <AuthCheck>
              <SignOutButton />
            </AuthCheck>
          </li>
        </ul>
      </div>
    </nav>
  );
}
