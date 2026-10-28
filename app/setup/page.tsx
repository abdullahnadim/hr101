import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";
import SetupForm from "./SetupForm";

const prisma = new PrismaClient();

export default async function SetupPage() {
  // Server-side lock: If ANY user exists, this page becomes permanently inaccessible.
  const userCount = await prisma.user.count();
  
  if (userCount > 0) {
    redirect("/login");
  }

  return <SetupForm />;
}