"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { PublicUser } from "@/lib/types";

/** Fetches the authenticated user (used for role-based UI gating on the client). */
export function useCurrentUser() {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: () => api.get<PublicUser>("/api/auth/me"),
    staleTime: 5 * 60_000,
  });
}
