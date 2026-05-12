import { headers } from "next/headers";

export type Principal = {
  userId: string;
  userDetails: string;
  identityProvider: string;
  userRoles: string[];
};

type RawPrincipal = {
  userId?: string;
  userDetails?: string;
  identityProvider?: string;
  userRoles?: string[];
};

const DEV_PRINCIPAL: Principal = {
  userId: "dev-user",
  userDetails: "dev@localhost",
  identityProvider: "dev",
  userRoles: ["authenticated", "anonymous"],
};

// Reads the Azure Static Web Apps client principal header that SWA injects
// after validating the auth cookie. The header is base64-encoded JSON.
// Locally there's no SWA in front of us, so we fall back to a dev principal
// to keep `npm run dev` usable without the SWA CLI.
export async function getPrincipal(): Promise<Principal> {
  const h = await headers();
  const raw = h.get("x-ms-client-principal");
  if (!raw) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Missing x-ms-client-principal header");
    }
    return DEV_PRINCIPAL;
  }

  let decoded: RawPrincipal;
  try {
    decoded = JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
  } catch {
    throw new Error("Malformed x-ms-client-principal header");
  }

  if (!decoded.userId) {
    throw new Error("client principal missing userId");
  }

  return {
    userId: decoded.userId,
    userDetails: decoded.userDetails ?? "",
    identityProvider: decoded.identityProvider ?? "",
    userRoles: decoded.userRoles ?? [],
  };
}
