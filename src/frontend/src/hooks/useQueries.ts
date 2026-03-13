import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Article, OrgSection, UserProfile, UserRole } from "../backend.d";
import { useActor } from "./useActor";

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

export function useGetFeaturedArticle() {
  const { actor, isFetching } = useActor();
  return useQuery<Article | null>({
    queryKey: ["featuredArticle"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getFeaturedArticle();
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

export function useGetOrgById(orgId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<OrgSection | null>({
    queryKey: ["org", orgId?.toString()],
    queryFn: async () => {
      if (!actor || orgId === null) return null;
      return actor.getOrgById(orgId);
    },
    enabled: !!actor && !isFetching && orgId !== null,
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

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: (_data, vars) => {
      // Invalidate both the caller profile and the specific user profile
      queryClient.invalidateQueries({ queryKey: ["callerProfile"] });
      queryClient.invalidateQueries({
        queryKey: ["userProfile", vars.principal.toString()],
      });
    },
  });
}

// ─── Admin Queries ────────────────────────────────────────────────────────────

const articleKeys = ["allArticles", "publishedArticles", "featuredArticle"];

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
      heroImageBlobId: string | null;
      heroImageBlobId2: string | null;
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
        args.heroImageBlobId,
        args.heroImageBlobId2,
        args.bodyContent,
        args.tags,
      );
    },
    onSuccess: () => {
      for (const key of articleKeys) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
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
      heroImageBlobId: string | null;
      heroImageBlobId2: string | null;
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
        args.heroImageBlobId,
        args.heroImageBlobId2,
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
