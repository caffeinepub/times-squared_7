import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Article,
  Comment,
  CrosswordCell,
  CrosswordClue,
  backendInterface as FullBackendInterface,
  OrgInvite,
  OrgMembership,
  OrgSection,
  Puzzle,
  PuzzleType,
  SubmissionWithArticle,
  UserProfile,
  UserRole,
} from "../backend.d";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

export function useGetPublishedArticles() {
  const { actor, isFetching } = useActor();
  return useQuery<Article[]>({
    queryKey: ["publishedArticles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPublishedArticles();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetArticleById(id: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Article | null>({
    queryKey: ["article", id?.toString()],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getArticleById(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useGetArticlesByTag(tag: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Article[]>({
    queryKey: ["articlesByTag", tag],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getArticlesByTag(tag);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetArticlesByOrg(orgId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Article[]>({
    queryKey: ["articlesByOrg", orgId?.toString()],
    queryFn: async () => {
      if (!actor || orgId === null) return [];
      return actor.getArticlesByOrg(orgId);
    },
    enabled: !!actor && !isFetching && orgId !== null,
  });
}

export function useGetAuthorArticles(principal: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Article[]>({
    queryKey: ["authorArticles", principal],
    queryFn: async () => {
      if (!actor || !principal) return [];
      const { Principal } = await import("@icp-sdk/core/principal");
      return actor.getAuthorArticles(Principal.fromText(principal));
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

export function useSearchArticles(query: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Article[]>({
    queryKey: ["search", query],
    queryFn: async () => {
      if (!actor || !query.trim()) return [];
      return actor.searchArticles(query);
    },
    enabled: !!actor && !isFetching && query.trim().length > 0,
  });
}

export function useGetOrgs() {
  const { actor, isFetching } = useActor();
  return useQuery<OrgSection[]>({
    queryKey: ["orgs"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOrgs();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetMyOrgs() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<OrgSection[]>({
    queryKey: ["myOrgs"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyOrgs();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useGetOrgById(orgId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<OrgSection | null>({
    queryKey: ["org", orgId?.toString()],
    queryFn: async () => {
      if (!actor || orgId === null) return null;
      return actor.getOrgById(orgId);
    },
    enabled: !!actor && !isFetching && orgId !== null,
    retry: false,
  });
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const query = useQuery<UserProfile | null>({
    queryKey: ["callerProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetUserProfile(principalStr: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["userProfile", principalStr],
    queryFn: async () => {
      if (!actor || !principalStr) return null;
      const { Principal } = await import("@icp-sdk/core/principal");
      return actor.getUserProfile(Principal.fromText(principalStr));
    },
    enabled: !!actor && !isFetching && !!principalStr,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetSuperAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<Principal | null>({
    queryKey: ["superAdmin"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getSuperAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useClaimSuperAdmin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.claimSuperAdmin();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superAdmin"] });
      queryClient.invalidateQueries({ queryKey: ["isAdmin"] });
    },
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["callerProfile"] });
      queryClient.invalidateQueries({
        queryKey: ["userProfile", vars.principal.toString()],
      });
    },
  });
}

// ─── Admin Queries ────────────────────────────────────────────────────────────

const articleKeys = ["allArticles", "publishedArticles"];

export function useGetAllArticles() {
  const { actor, isFetching } = useActor();
  return useQuery<Article[]>({
    queryKey: ["allArticles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllArticles();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateArticle() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      title: string;
      author: string;
      authorPrincipal: Principal | null;
      organizationId: bigint | null;
      publicationDate: string;
      imageBlobIds: string[];
      bodyContent: string;
      tags: string[];
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createArticle(
        args.title,
        args.author,
        args.authorPrincipal,
        args.organizationId,
        args.publicationDate,
        args.imageBlobIds,
        args.bodyContent,
        args.tags,
      );
    },
    onSuccess: () => {
      for (const key of articleKeys) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
      queryClient.invalidateQueries({ queryKey: ["mySubmissions"] });
    },
  });
}

export function useUpdateArticle() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      articleId: bigint;
      title: string;
      author: string;
      organizationId: bigint | null;
      publicationDate: string;
      imageBlobIds: string[];
      bodyContent: string;
      tags: string[];
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateArticle(
        args.articleId,
        args.title,
        args.author,
        args.organizationId,
        args.publicationDate,
        args.imageBlobIds,
        args.bodyContent,
        args.tags,
      );
    },
    onSuccess: (_data, vars) => {
      for (const key of articleKeys) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
      queryClient.invalidateQueries({
        queryKey: ["article", vars.articleId.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["mySubmissions"] });
    },
  });
}

export function useDeleteArticle() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (articleId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteArticle(articleId);
    },
    onSuccess: () => {
      for (const key of articleKeys) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
      queryClient.invalidateQueries({ queryKey: ["mySubmissions"] });
    },
  });
}

export function usePublishArticle() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (articleId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.publishArticle(articleId);
    },
    onSuccess: () => {
      for (const key of articleKeys) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });
}

export function useUnpublishArticle() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (articleId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.unpublishArticle(articleId);
    },
    onSuccess: () => {
      for (const key of articleKeys) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });
}

export function useFeatureArticle() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (articleId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.featureArticle(articleId);
    },
    onSuccess: () => {
      for (const key of articleKeys) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
      queryClient.invalidateQueries({ queryKey: ["articlesByTag"] });
      queryClient.invalidateQueries({ queryKey: ["articlesByOrg"] });
    },
  });
}

export function useUnfeatureArticle() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (articleId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.unfeatureArticle(articleId);
    },
    onSuccess: () => {
      for (const key of articleKeys) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
      queryClient.invalidateQueries({ queryKey: ["articlesByTag"] });
      queryClient.invalidateQueries({ queryKey: ["articlesByOrg"] });
    },
  });
}

export function useCreateOrg() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      name: string;
      slug: string;
      description: string;
      logoBlobId: string | null;
      bannerBlobId: string | null;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createOrg(
        args.name,
        args.slug,
        args.description,
        args.logoBlobId,
        args.bannerBlobId,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orgs"] });
      queryClient.invalidateQueries({ queryKey: ["myOrgs"] });
    },
  });
}

export function useUpdateOrg() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      orgId: bigint;
      name: string;
      slug: string;
      description: string;
      logoBlobId: string | null;
      bannerBlobId: string | null;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateOrg(
        args.orgId,
        args.name,
        args.slug,
        args.description,
        args.logoBlobId,
        args.bannerBlobId,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orgs"] });
      queryClient.invalidateQueries({ queryKey: ["myOrgs"] });
    },
  });
}

export function useDeleteOrg() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orgId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteOrg(orgId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orgs"] });
      queryClient.invalidateQueries({ queryKey: ["myOrgs"] });
    },
  });
}

export function useAssignUserRole() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (args: { user: Principal; role: UserRole }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.assignCallerUserRole(args.user, args.role);
    },
  });
}

// ─── Invite & Membership Queries ─────────────────────────────────────────────

export function useGetMyInvites() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<OrgInvite[]>({
    queryKey: ["myInvites"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyInvites();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useGetMyMemberships() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<OrgMembership[]>({
    queryKey: ["myMemberships"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyMemberships();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useGetOrgMembers(orgId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<OrgMembership[]>({
    queryKey: ["orgMembers", orgId?.toString()],
    queryFn: async () => {
      if (!actor || orgId === null) return [];
      return actor.getOrgMembers(orgId);
    },
    enabled: !!actor && !isFetching && orgId !== null,
  });
}

export function useInviteUserToOrg() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { orgId: bigint; userPrincipal: Principal }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.inviteUserToOrg(args.orgId, args.userPrincipal);
    },
    onSuccess: (_data, args) => {
      queryClient.invalidateQueries({
        queryKey: ["orgMembers", args.orgId.toString()],
      });
    },
  });
}

export function useRemoveOrgMember() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      orgId: bigint;
      memberPrincipal: Principal;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.removeOrgMember(args.orgId, args.memberPrincipal);
    },
    onSuccess: (_data, args) => {
      queryClient.invalidateQueries({
        queryKey: ["orgMembers", args.orgId.toString()],
      });
    },
  });
}

export function useRespondToOrgInvite() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { inviteId: bigint; accept: boolean }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.respondToOrgInvite(args.inviteId, args.accept);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myInvites"] });
      queryClient.invalidateQueries({ queryKey: ["myMemberships"] });
    },
  });
}

// ─── B2: Submission Queries ───────────────────────────────────────────────────

export function useGetMySubmissions() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<SubmissionWithArticle[]>({
    queryKey: ["mySubmissions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMySubmissions();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useGetPendingSubmissions(orgId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<SubmissionWithArticle[]>({
    queryKey: ["pendingSubmissions", orgId?.toString()],
    queryFn: async () => {
      if (!actor || orgId === null) return [];
      return actor.getPendingSubmissions(orgId);
    },
    enabled: !!actor && !isFetching && orgId !== null,
  });
}

export function useSubmitArticleForReview() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (articleId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.submitArticleForReview(articleId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mySubmissions"] });
    },
  });
}

export function useApproveArticleSubmission() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (articleId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.approveArticleSubmission(articleId);
    },
    onSuccess: () => {
      for (const key of articleKeys) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
      queryClient.invalidateQueries({ queryKey: ["pendingSubmissions"] });
    },
  });
}

export function useRejectArticleSubmission() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { articleId: bigint; note: string | null }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.rejectArticleSubmission(args.articleId, args.note);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingSubmissions"] });
    },
  });
}

// ─── Comment Queries ──────────────────────────────────────────────────────────

export function useGetCommentsByArticle(articleId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Comment[]>({
    queryKey: ["comments", articleId?.toString()],
    queryFn: async () => {
      if (!actor || articleId === null) return [];
      return actor.getCommentsByArticle(articleId);
    },
    enabled: !!actor && !isFetching && articleId !== null,
  });
}

export function useAddComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { articleId: bigint; body: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addComment(args.articleId, args.body);
    },
    onSuccess: (_data, args) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", args.articleId.toString()],
      });
    },
  });
}

export function useDeleteComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteComment(commentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
    },
  });
}

// ─── Puzzle Queries ───────────────────────────────────────────────────────────

// The generated backend.ts interface lacks puzzle methods; cast actor at call sites.
function puzzleActor(actor: unknown): FullBackendInterface {
  return actor as FullBackendInterface;
}

export function useGetAllPuzzles() {
  const { actor, isFetching } = useActor();
  return useQuery<Puzzle[]>({
    queryKey: ["allPuzzles"],
    queryFn: async () => {
      if (!actor) return [];
      return puzzleActor(actor).getAllPuzzles();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreatePuzzle() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      puzzleType: PuzzleType;
      title: string;
      gridWidth: bigint;
      gridHeight: bigint;
      cells: CrosswordCell[];
      clues: CrosswordClue[];
    }) => {
      if (!actor) throw new Error("Actor not available");
      return puzzleActor(actor).createPuzzle(
        args.puzzleType,
        args.title,
        args.gridWidth,
        args.gridHeight,
        args.cells,
        args.clues,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allPuzzles"] });
    },
  });
}

export function useUpdatePuzzle() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      id: bigint;
      title: string;
      gridWidth: bigint;
      gridHeight: bigint;
      cells: CrosswordCell[];
      clues: CrosswordClue[];
    }) => {
      if (!actor) throw new Error("Actor not available");
      return puzzleActor(actor).updatePuzzle(
        args.id,
        args.title,
        args.gridWidth,
        args.gridHeight,
        args.cells,
        args.clues,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allPuzzles"] });
    },
  });
}

export function useDeletePuzzle() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return puzzleActor(actor).deletePuzzle(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allPuzzles"] });
    },
  });
}

export function useSetActivePuzzle() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return puzzleActor(actor).setActivePuzzle(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allPuzzles"] });
    },
  });
}
