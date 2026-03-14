import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { OrgInvite } from "../backend.d";
import { OrgInviteStatus } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetMyInvites,
  useGetOrgs,
  useRespondToOrgInvite,
} from "../hooks/useQueries";

function formatDate(ns: bigint): string {
  const ms = Number(ns / 1_000_000n);
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function InviteRow({
  invite,
  orgName,
  index,
}: {
  invite: OrgInvite;
  orgName: string;
  index: number;
}) {
  const { mutateAsync: respond, isPending } = useRespondToOrgInvite();

  const handleRespond = async (accept: boolean) => {
    try {
      await respond({ inviteId: invite.inviteId, accept });
      toast.success(accept ? "Invitation accepted" : "Invitation declined");
    } catch {
      toast.error("Failed to respond to invite");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="flex items-center justify-between gap-4 py-4 border-b border-white/10 last:border-0"
    >
      <div className="flex-1 min-w-0">
        <p className="text-white font-sans text-sm font-medium">{orgName}</p>
        <p className="text-white/40 font-sans text-xs mt-0.5">
          Invited {formatDate(invite.createdAt)}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          data-ocid={`invite.accept_button.${index}`}
          disabled={isPending}
          onClick={() => handleRespond(true)}
          className="px-3 py-1.5 bg-white text-black text-[10px] uppercase tracking-wider font-sans hover:bg-white/90 transition-colors disabled:opacity-50"
        >
          Accept
        </button>
        <button
          type="button"
          data-ocid={`invite.decline_button.${index}`}
          disabled={isPending}
          onClick={() => handleRespond(false)}
          className="px-3 py-1.5 border border-white/20 text-white/60 text-[10px] uppercase tracking-wider font-sans hover:border-white/40 hover:text-white transition-colors disabled:opacity-50"
        >
          Decline
        </button>
      </div>
    </motion.div>
  );
}

export default function InviteBanner() {
  const { identity } = useInternetIdentity();
  const { data: invites = [] } = useGetMyInvites();
  const { data: orgs = [] } = useGetOrgs();
  const [open, setOpen] = useState(false);

  const pendingInvites = invites.filter(
    (inv) => inv.status === OrgInviteStatus.pending,
  );

  if (!identity || pendingInvites.length === 0) return null;

  const getOrgName = (orgId: bigint) => {
    return orgs.find((o) => o.id === orgId)?.name ?? "Unknown Organisation";
  };

  return (
    <AnimatePresence>
      <motion.div
        data-ocid="invite.banner"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3 }}
        className="border-b border-white/10 bg-white/[0.03]"
      >
        <div className="max-w-5xl mx-auto px-6 py-2.5 flex items-center justify-between gap-4">
          <p className="text-white/60 font-sans text-xs">
            You have{" "}
            <span className="text-white font-medium">
              {pendingInvites.length}
            </span>{" "}
            pending org invitation{pendingInvites.length !== 1 ? "s" : ""}
          </p>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                data-ocid="invite.open_modal_button"
                className="text-white/80 hover:text-white text-[10px] uppercase tracking-wider font-sans underline underline-offset-2 transition-colors"
              >
                View
              </button>
            </DialogTrigger>
            <DialogContent
              data-ocid="invite.dialog"
              className="bg-black border border-white/20 text-white max-w-md"
            >
              <DialogHeader>
                <DialogTitle className="font-editorial text-white text-xl">
                  Org Invitations
                </DialogTitle>
              </DialogHeader>

              <div className="mt-2">
                <AnimatePresence>
                  {pendingInvites.length === 0 ? (
                    <p className="text-white/40 font-sans text-sm py-4 text-center">
                      No pending invitations.
                    </p>
                  ) : (
                    pendingInvites.map((invite, i) => (
                      <InviteRow
                        key={invite.inviteId.toString()}
                        invite={invite}
                        orgName={getOrgName(invite.orgId)}
                        index={i + 1}
                      />
                    ))
                  )}
                </AnimatePresence>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
