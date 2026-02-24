import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

const PUBLIC_PROJECT_IDS = (process.env.PUBLIC_PROJECT_IDS || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

export interface TokenResult {
  token: string;
  isPublicAccess: boolean;
}

export async function resolveToken(
  projectId?: string
): Promise<TokenResult | null> {
  // 1. Check session token first
  const session = await getServerSession(authOptions);
  if (session?.accessToken) {
    return { token: session.accessToken, isPublicAccess: false };
  }

  // 2. Fall back to env token for public projects
  if (projectId && PUBLIC_PROJECT_IDS.includes(projectId)) {
    const envToken = process.env.RDM_API_TOKEN;
    if (envToken) {
      return { token: envToken, isPublicAccess: true };
    }
  }

  return null;
}
