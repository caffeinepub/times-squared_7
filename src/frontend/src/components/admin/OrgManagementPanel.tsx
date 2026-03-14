import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { OrgSection } from "../../backend.d";
import {
  useCreateOrg,
  useDeleteOrg,
  useGetMyOrgs,
  useUpdateOrg,
} from "../../hooks/useQueries";
import { uploadFileToBlobStorage } from "../../hooks/useUploadFile";

type FormState = {
  name: string;
  slug: string;
  description: string;
  logoBlobId: string | null;
  bannerBlobId: string | null;
};

const emptyForm = (): FormState => ({
  name: "",
  slug: "",
  description: "",
  logoBlobId: null,
  bannerBlobId: null,
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function OrgManagementPanel() {
  const { data: orgs = [], isLoading } = useGetMyOrgs();
  const { mutateAsync: createOrg, isPending: isCreating } = useCreateOrg();
  const { mutateAsync: updateOrg, isPending: isUpdating } = useUpdateOrg();
  const { mutateAsync: deleteOrg } = useDeleteOrg();

  const [editingOrg, setEditingOrg] = useState<OrgSection | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const startNew = () => {
    setEditingOrg(null);
    setForm(emptyForm());
    setShowForm(true);
  };

  const startEdit = (org: OrgSection) => {
    setEditingOrg(org);
    setForm({
      name: org.name,
      slug: org.slug,
      description: org.description,
      logoBlobId: org.logoBlobId ?? null,
      bannerBlobId: org.bannerBlobId ?? null,
    });
    setShowForm(true);
  };

  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: editingOrg ? prev.slug : slugify(name),
    }));
  };

  const handleLogoUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploadingLogo(true);
      try {
        const url = await uploadFileToBlobStorage(file);
        setForm((prev) => ({ ...prev, logoBlobId: url }));
        toast.success("Logo uploaded");
      } catch {
        toast.error("Upload failed");
      } finally {
        setUploadingLogo(false);
      }
    },
    [],
  );

  const handleBannerUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploadingBanner(true);
      try {
        const url = await uploadFileToBlobStorage(file);
        setForm((prev) => ({ ...prev, bannerBlobId: url }));
        toast.success("Banner uploaded");
      } catch {
        toast.error("Upload failed");
      } finally {
        setUploadingBanner(false);
      }
    },
    [],
  );

  const handleSubmit = async () => {
    try {
      if (editingOrg) {
        await updateOrg({
          orgId: editingOrg.id,
          name: form.name,
          slug: form.slug,
          description: form.description,
          logoBlobId: form.logoBlobId,
          bannerBlobId: form.bannerBlobId,
        });
        toast.success("Organisation updated");
      } else {
        await createOrg({
          name: form.name,
          slug: form.slug,
          description: form.description,
          logoBlobId: form.logoBlobId,
          bannerBlobId: form.bannerBlobId,
        });
        toast.success("Organisation created");
      }
      setShowForm(false);
      setEditingOrg(null);
    } catch {
      toast.error("Save failed");
    }
  };

  const isPending = isCreating || isUpdating;

  return (
    <div data-ocid="admin.orgs.panel" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="section-label">My Organisations</span>
        {!showForm && (
          <button
            type="button"
            data-ocid="admin.new_org.button"
            onClick={startNew}
            className="flex items-center gap-1.5 bg-white text-black px-3 py-1.5 text-[10px] uppercase tracking-wider font-sans hover:bg-white/90 transition-colors"
          >
            <Plus size={12} />
            New
          </button>
        )}
      </div>

      {/* Inline Form */}
      {showForm && (
        <div className="border border-white/20 p-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-xs font-sans uppercase tracking-wider">
              {editingOrg ? "Edit Organisation" : "New Organisation"}
            </span>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingOrg(null);
              }}
              className="text-white/30 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <div className="space-y-1">
            <Label className="text-white/40 text-[10px] uppercase tracking-widest font-sans">
              Name
            </Label>
            <input
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Organisation name"
              className="w-full bg-transparent border border-white/20 text-white font-sans text-sm px-3 py-2 focus:outline-none focus:border-white/40 placeholder:text-white/20"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-white/40 text-[10px] uppercase tracking-widest font-sans">
              Slug
            </Label>
            <input
              value={form.slug}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, slug: e.target.value }))
              }
              placeholder="org-slug"
              className="w-full bg-transparent border border-white/20 text-white/60 font-sans text-sm px-3 py-2 focus:outline-none focus:border-white/40 placeholder:text-white/20"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-white/40 text-[10px] uppercase tracking-widest font-sans">
              Description
            </Label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Brief description"
              rows={3}
              className="w-full bg-transparent border border-white/20 text-white/70 font-sans text-sm px-3 py-2 focus:outline-none focus:border-white/40 placeholder:text-white/20 resize-none"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-white/40 text-[10px] uppercase tracking-widest font-sans">
              Logo
            </Label>
            <label
              data-ocid="admin.org.upload_button"
              className="flex items-center gap-2 border border-dashed border-white/20 px-3 py-2 text-white/40 text-xs font-sans cursor-pointer hover:border-white/40 transition-colors"
            >
              {uploadingLogo && <Loader2 size={12} className="animate-spin" />}
              {form.logoBlobId ? "Replace logo" : "Upload logo"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </label>
          </div>

          <div className="space-y-1">
            <Label className="text-white/40 text-[10px] uppercase tracking-widest font-sans">
              Banner
            </Label>
            <label className="flex items-center gap-2 border border-dashed border-white/20 px-3 py-2 text-white/40 text-xs font-sans cursor-pointer hover:border-white/40 transition-colors">
              {uploadingBanner && (
                <Loader2 size={12} className="animate-spin" />
              )}
              {form.bannerBlobId ? "Replace banner" : "Upload banner"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleBannerUpload}
              />
            </label>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              data-ocid="admin.org.save_button"
              onClick={handleSubmit}
              disabled={isPending}
              className="flex items-center gap-2 bg-white text-black px-4 py-2 text-xs font-sans uppercase tracking-wider hover:bg-white/90 transition-colors disabled:opacity-50"
            >
              {isPending && <Loader2 size={12} className="animate-spin" />}
              {isPending ? "Saving..." : editingOrg ? "Update" : "Create"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingOrg(null);
              }}
              className="text-white/40 hover:text-white text-xs font-sans uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-12 w-full bg-white/5" />
          ))}
        </div>
      )}

      {!isLoading && orgs.length === 0 && !showForm && (
        <div data-ocid="admin.orgs.empty_state" className="py-6 text-center">
          <p className="text-white/30 text-sm font-sans">
            No organisations yet.
          </p>
        </div>
      )}

      {!isLoading && (
        <div className="space-y-px">
          {orgs.map((org, i) => (
            <div
              key={org.id.toString()}
              data-ocid={`admin.org.item.${i + 1}`}
              className="flex items-center gap-2 py-3 border-b border-white/10 group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-white/80 text-sm font-sans truncate">
                  {org.name}
                </p>
                <p className="text-white/30 text-[10px] font-sans">
                  {org.slug}
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  data-ocid={`admin.org.edit_button.${i + 1}`}
                  onClick={() => startEdit(org)}
                  className="p-1.5 text-white/30 hover:text-white/80 transition-colors"
                >
                  <Pencil size={12} />
                </button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      type="button"
                      data-ocid={`admin.org.delete_button.${i + 1}`}
                      className="p-1.5 text-white/20 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-black border border-white/20 text-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-editorial text-white">
                        Delete Organisation?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-white/50 font-sans">
                        "{org.name}" will be permanently deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-transparent border-white/20 text-white/60 hover:bg-white/5 hover:text-white">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteOrg(org.id)}
                        className="bg-red-500/80 hover:bg-red-500 text-white border-0"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
