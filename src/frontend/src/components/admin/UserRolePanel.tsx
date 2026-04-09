import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { UserRole } from "../../backend.d";
import { useAssignUserRole, useGetSuperAdmin } from "../../hooks/useQueries";

export default function UserRolePanel() {
  const { mutateAsync: assignRole, isPending } = useAssignUserRole();
  const { identity } = useInternetIdentity();
  const { data: superAdmin } = useGetSuperAdmin();
  const [principalStr, setPrincipalStr] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.user);

  const callerPrincipal = identity?.getPrincipal().toString();
  const isSuperAdmin =
    !!superAdmin &&
    !!callerPrincipal &&
    superAdmin.toString() === callerPrincipal;

  const handleSubmit = async () => {
    if (!principalStr.trim()) {
      toast.error("Enter a principal ID");
      return;
    }
    try {
      const { Principal } = await import("@icp-sdk/core/principal");
      const user = Principal.fromText(principalStr.trim());
      await assignRole({ user, role });
      toast.success("Role assigned");
      setPrincipalStr("");
    } catch {
      toast.error("Invalid principal or assignment failed");
    }
  };

  return (
    <div data-ocid="admin.users.panel" className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="section-label">User Roles</span>
        {isSuperAdmin && (
          <span className="text-[9px] font-sans uppercase tracking-widest bg-white/10 text-white/60 px-2 py-0.5">
            Super Admin
          </span>
        )}
      </div>
      <p className="text-white/40 text-xs font-sans leading-relaxed">
        Enter a user's principal ID to assign or change their role.
      </p>

      {!isSuperAdmin && (
        <p className="text-white/30 text-xs font-sans leading-relaxed border border-white/10 px-3 py-2">
          Only the super admin can grant admin roles.
        </p>
      )}

      <div className="space-y-1">
        <Label className="text-white/40 text-[10px] uppercase tracking-widest font-sans">
          Principal ID
        </Label>
        <input
          data-ocid="admin.user_role.input"
          value={principalStr}
          onChange={(e) => setPrincipalStr(e.target.value)}
          placeholder="aaaaa-aa..."
          className="w-full bg-transparent border border-white/20 text-white font-sans text-sm px-3 py-2 focus:outline-none focus:border-white/40 placeholder:text-white/20"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-white/40 text-[10px] uppercase tracking-widest font-sans">
          Role
        </Label>
        <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
          <SelectTrigger
            data-ocid="admin.user_role.select"
            className="bg-transparent border-white/20 text-white/70 font-sans text-sm focus:ring-0"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-black border-white/20 text-white">
            {isSuperAdmin && (
              <SelectItem value={UserRole.admin} className="font-sans">
                Admin
              </SelectItem>
            )}
            <SelectItem value={UserRole.user} className="font-sans">
              User
            </SelectItem>
            <SelectItem value={UserRole.guest} className="font-sans">
              Guest
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <button
        type="button"
        data-ocid="admin.user_role.submit_button"
        onClick={handleSubmit}
        disabled={isPending}
        className="flex items-center gap-2 bg-white text-black px-4 py-2 text-xs font-sans uppercase tracking-wider hover:bg-white/90 transition-colors disabled:opacity-50 w-fit"
      >
        {isPending && <Loader2 size={12} className="animate-spin" />}
        {isPending ? "Assigning..." : "Assign Role"}
      </button>
    </div>
  );
}
