import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Edit2, Loader2, Save, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import ArticleCard from "../components/ArticleCard";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetAuthorArticles,
  useGetMyMemberships,
  useGetOrgs,
  useGetUserProfile,
  useSaveCallerUserProfile,
} from "../hooks/useQueries";
import { uploadFileToBlobStorage } from "../hooks/useUploadFile";
import { navigate } from "../lib/navigate";

interface AuthorPageProps {
  principal: string;
}

export default function AuthorPage({ principal }: AuthorPageProps) {
  const { identity } = useInternetIdentity();
  const { data: profile, isLoading } = useGetUserProfile(principal);
  const { data: articles = [] } = useGetAuthorArticles(principal);
  const { data: orgs = [] } = useGetOrgs();
  const { data: myMemberships = [] } = useGetMyMemberships();
  const { mutateAsync: saveProfile, isPending: isSaving } =
    useSaveCallerUserProfile();

  const isOwnProfile = identity?.getPrincipal().toString() === principal;
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [pendingAvatarBlobId, setPendingAvatarBlobId] = useState<string | null>(
    null,
  );
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const resolvedAvatarUrl = (() => {
    if (avatarUrl) return avatarUrl;
    if (profile?.avatarBlobId) {
      try {
        return ExternalBlob.fromURL(profile.avatarBlobId).getDirectURL();
      } catch {
        return null;
      }
    }
    return null;
  })();

  const profileOrgId =
    profile?.orgId != null && typeof profile.orgId === "bigint"
      ? profile.orgId
      : null;
  const orgAffiliation = profileOrgId
    ? (orgs.find((o) => o.id === profileOrgId) ?? null)
    : null;

  const initials = (profile?.name ?? principal.slice(0, 2))
    .slice(0, 2)
    .toUpperCase();

  const startEditing = () => {
    setEditName(profile?.name ?? "");
    setEditBio(profile?.bio ?? "");
    setPendingAvatarBlobId(null);
    setAvatarUrl(null);
    setEditing(true);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const url = await uploadFileToBlobStorage(file);
      setAvatarUrl(url);
      setPendingAvatarBlobId(url);
      toast.success("Avatar uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!identity) return;
    try {
      const { Principal } = await import("@icp-sdk/core/principal");
      await saveProfile({
        name: editName,
        bio: editBio,
        principal: Principal.fromText(principal),
        avatarBlobId: pendingAvatarBlobId ?? profile?.avatarBlobId,
        orgId: profile?.orgId,
      });
      setEditing(false);
      setPendingAvatarBlobId(null);
      setAvatarUrl(null);
      toast.success("Profile saved");
    } catch {
      toast.error("Save failed");
    }
  };

  // Memberships enriched with org name + slug
  const enrichedMemberships = myMemberships
    .map((m) => {
      const org = orgs.find((o) => o.id === m.orgId);
      return org ? { ...m, orgName: org.name, orgSlug: org.slug } : null;
    })
    .filter(Boolean) as Array<{
    orgId: bigint;
    orgName: string;
    orgSlug: string;
  }>;

  if (isLoading) {
    return (
      <div
        data-ocid="author.loading_state"
        className="max-w-3xl mx-auto px-6 py-20"
      >
        <div className="space-y-4">
          <div className="h-16 w-16 rounded-full bg-white/10 animate-pulse" />
          <div className="h-8 w-1/3 bg-white/10 animate-pulse" />
          <div className="h-4 w-2/3 bg-white/10 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <main data-ocid="author.page" className="min-h-screen bg-black">
      <div className="max-w-3xl mx-auto px-6">
        <div className="pt-8 pb-6">
          <button
            type="button"
            data-ocid="author.back.button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm font-sans uppercase tracking-wider"
          >
            <ArrowLeft size={14} />
            Back
          </button>
        </div>

        <div className="py-8">
          <div className="flex items-start justify-between gap-6 mb-6">
            <div className="flex items-center gap-5">
              {/* Avatar with upload overlay when editing */}
              <div className="relative">
                <Avatar className="w-16 h-16">
                  {resolvedAvatarUrl && (
                    <AvatarImage src={resolvedAvatarUrl} alt={profile?.name} />
                  )}
                  <AvatarFallback className="bg-white/10 text-white text-xl font-editorial">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {editing && isOwnProfile && (
                  <>
                    <button
                      type="button"
                      data-ocid="author.avatar.upload_button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full text-white/70 hover:text-white hover:bg-black/70 transition-colors"
                      title="Change avatar"
                    >
                      {uploadingAvatar ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <span className="text-[9px] uppercase tracking-wider font-sans">
                          Edit
                        </span>
                      )}
                    </button>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                  </>
                )}
              </div>

              <div>
                {editing ? (
                  <Input
                    data-ocid="author.name.input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="bg-transparent border-white/30 text-white font-editorial text-2xl h-auto py-1 focus-visible:ring-0"
                    placeholder="Your name"
                  />
                ) : (
                  <h1
                    className="font-editorial text-white"
                    style={{ fontSize: "clamp(1.6rem, 4vw, 2.5rem)" }}
                  >
                    {profile?.name ?? "Anonymous Author"}
                  </h1>
                )}
                {orgAffiliation && (
                  <button
                    type="button"
                    data-ocid="author.org.link"
                    onClick={() => navigate(`/org/${orgAffiliation.slug}`)}
                    className="text-white/40 text-sm font-sans hover:text-white/60 transition-colors mt-1"
                  >
                    {orgAffiliation.name}
                  </button>
                )}
              </div>
            </div>
            {isOwnProfile && !editing && (
              <button
                type="button"
                data-ocid="author.edit.button"
                onClick={startEditing}
                className="flex items-center gap-2 text-white/30 hover:text-white/60 transition-colors text-xs font-sans uppercase tracking-wider"
              >
                <Edit2 size={12} />
                {profile ? "Edit Profile" : "Create Profile"}
              </button>
            )}
          </div>

          {editing ? (
            <div className="mb-8 space-y-4">
              <Textarea
                data-ocid="author.bio.textarea"
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                className="bg-transparent border-white/30 text-white/80 font-sans focus-visible:ring-0 resize-none"
                placeholder="Your bio"
                rows={4}
              />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  data-ocid="author.save.button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-white text-black px-4 py-2 text-xs font-sans uppercase tracking-wider hover:bg-white/90 transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Save size={12} />
                  )}
                  {isSaving ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  data-ocid="author.cancel.button"
                  onClick={() => {
                    setEditing(false);
                    setAvatarUrl(null);
                    setPendingAvatarBlobId(null);
                  }}
                  className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-xs font-sans uppercase tracking-wider"
                >
                  <X size={12} />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            profile?.bio && (
              <p className="text-white/60 font-sans leading-relaxed mb-8">
                {profile.bio}
              </p>
            )
          )}
        </div>

        <div className="divider-white" />

        <section data-ocid="author.articles.section" className="py-8">
          <p className="section-label mb-8">
            Articles by {profile?.name ?? "this author"}
          </p>

          {articles.length === 0 ? (
            <div
              data-ocid="author.articles.empty_state"
              className="py-12 text-center"
            >
              <p className="text-white/40 font-sans text-sm">
                No published articles yet.
              </p>
            </div>
          ) : (
            articles.map((article, i) => (
              <ArticleCard
                key={article.id.toString()}
                article={article}
                index={i}
                orgs={orgs}
              />
            ))
          )}
        </section>

        {/* Org Memberships — only visible on own profile */}
        {isOwnProfile && enrichedMemberships.length > 0 && (
          <>
            <div className="divider-white" />
            <section data-ocid="author.memberships.section" className="py-8">
              <p className="section-label mb-6">Org Memberships</p>
              <div className="space-y-2">
                {enrichedMemberships.map((m, i) => (
                  <button
                    key={m.orgId.toString()}
                    type="button"
                    data-ocid={`author.membership.link.${i + 1}`}
                    onClick={() => navigate(`/org/${m.orgSlug}`)}
                    className="flex items-center gap-3 w-full text-left py-2 text-white/70 hover:text-white transition-colors font-sans text-sm group"
                  >
                    <span className="w-1 h-1 rounded-full bg-white/30 group-hover:bg-white/60 transition-colors" />
                    {m.orgName}
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
