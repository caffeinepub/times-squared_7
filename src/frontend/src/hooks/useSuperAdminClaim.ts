import { useActor, useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { createActor } from "../backend";

/**
 * Silently claims super admin on first login if no super admin exists yet.
 * Runs once after actor + identity are ready.
 */
export function useSuperAdminClaim() {
  const { actor, isFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const hasClaimed = useRef(false);

  useEffect(() => {
    if (!actor || isFetching || !identity || hasClaimed.current) return;

    (async () => {
      try {
        const superAdmin = await actor.getSuperAdmin();
        if (superAdmin == null) {
          await actor.claimSuperAdmin();
          hasClaimed.current = true;
          queryClient.invalidateQueries({ queryKey: ["superAdmin"] });
          queryClient.invalidateQueries({ queryKey: ["isAdmin"] });
        }
      } catch {
        // Silently ignore — may already be claimed by another principal
      }
    })();
  }, [actor, isFetching, identity, queryClient]);
}
