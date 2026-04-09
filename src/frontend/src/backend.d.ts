import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface ArticleSubmission {
    submittedAt?: bigint;
    submissionStatus: SubmissionStatus;
    articleId: bigint;
    rejectionNote?: string;
}
export interface OrgInvite {
    status: OrgInviteStatus;
    orgId: bigint;
    inviteId: bigint;
    createdAt: bigint;
    invitedPrincipal: Principal;
    invitedByPrincipal: Principal;
}
export interface Comment {
    id: bigint;
    body: string;
    createdAt: bigint;
    authorName: string;
    articleId: bigint;
    authorPrincipal: Principal;
}
export interface CrosswordClue {
    direction: ClueDirection;
    clue: string;
    startCol: bigint;
    startRow: bigint;
    answer: string;
    length: bigint;
    number: bigint;
}
export interface CrosswordCell {
    isBlack: boolean;
    number?: bigint;
    letter: string;
}
export interface SubmissionWithArticle {
    article: Article;
    submission: ArticleSubmission;
}
export interface Puzzle {
    id: bigint;
    title: string;
    puzzleType: PuzzleType;
    gridHeight: bigint;
    cells: Array<CrosswordCell>;
    clues: Array<CrosswordClue>;
    createdAt: bigint;
    createdBy: Principal;
    publishedAt?: bigint;
    isActive: boolean;
    gridWidth: bigint;
}
export interface OrgSection {
    id: bigint;
    bannerBlobId?: string;
    name: string;
    createdAt: bigint;
    slug: string;
    description: string;
    logoBlobId?: string;
}
export interface OrgMembership {
    orgId: bigint;
    memberPrincipal: Principal;
    joinedAt: bigint;
}
export interface UserProfile {
    bio: string;
    principal: Principal;
    orgId?: bigint;
    name: string;
    avatarBlobId?: string;
}
export interface Article {
    id: bigint;
    organizationId?: bigint;
    bodyContent: string;
    title: string;
    isPublished: boolean;
    imageBlobIds: Array<string>;
    createdAt: bigint;
    tags: Array<string>;
    author: string;
    isFeatured: boolean;
    publicationDate: string;
    excerpt: string;
    authorPrincipal?: Principal;
}
export enum ClueDirection {
    across = "across",
    down = "down"
}
export enum OrgInviteStatus {
    pending = "pending",
    accepted = "accepted",
    declined = "declined"
}
export enum PuzzleType {
    mini = "mini",
    standard = "standard"
}
export enum SubmissionStatus {
    pending_review = "pending_review",
    rejected = "rejected",
    draft = "draft"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addComment(articleId: bigint, body: string): Promise<void>;
    approveArticleSubmission(articleId: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    claimSuperAdmin(): Promise<void>;
    createArticle(title: string, author: string, authorPrincipal: Principal | null, organizationId: bigint | null, publicationDate: string, imageBlobIds: Array<string>, bodyContent: string, tags: Array<string>): Promise<bigint>;
    createOrg(name: string, slug: string, description: string, logoBlobId: string | null, bannerBlobId: string | null): Promise<bigint>;
    createPuzzle(puzzleType: PuzzleType, title: string, gridWidth: bigint, gridHeight: bigint, cells: Array<CrosswordCell>, clues: Array<CrosswordClue>): Promise<bigint>;
    deleteArticle(articleId: bigint): Promise<void>;
    deleteComment(commentId: bigint): Promise<void>;
    deleteOrg(orgId: bigint): Promise<void>;
    deletePuzzle(id: bigint): Promise<void>;
    featureArticle(articleId: bigint): Promise<void>;
    getActivePuzzle(puzzleType: PuzzleType): Promise<Puzzle | null>;
    getAllArticles(): Promise<Array<Article>>;
    getAllPuzzles(): Promise<Array<Puzzle>>;
    getArticleById(articleId: bigint): Promise<Article>;
    getArticlesByOrg(orgId: bigint): Promise<Array<Article>>;
    getArticlesByTag(tag: string): Promise<Array<Article>>;
    getAuthorArticles(authorPrincipal: Principal): Promise<Array<Article>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCommentsByArticle(articleId: bigint): Promise<Array<Comment>>;
    getMyInvites(): Promise<Array<OrgInvite>>;
    getMyMemberships(): Promise<Array<OrgMembership>>;
    getMyOrgs(): Promise<Array<OrgSection>>;
    getMySubmissions(): Promise<Array<SubmissionWithArticle>>;
    getOrgArticles(orgId: bigint): Promise<Array<Article>>;
    getOrgById(orgId: bigint): Promise<OrgSection | null>;
    getOrgMembers(orgId: bigint): Promise<Array<OrgMembership>>;
    getOrgs(): Promise<Array<OrgSection>>;
    getPendingSubmissions(orgId: bigint): Promise<Array<SubmissionWithArticle>>;
    getPublishedArticles(): Promise<Array<Article>>;
    getSuperAdmin(): Promise<Principal | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    inviteUserToOrg(orgId: bigint, userPrincipal: Principal): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    isOrgMember(orgId: bigint, user: Principal): Promise<boolean>;
    publishArticle(articleId: bigint): Promise<void>;
    rejectArticleSubmission(articleId: bigint, note: string | null): Promise<void>;
    removeOrgMember(orgId: bigint, memberPrincipal: Principal): Promise<void>;
    respondToOrgInvite(inviteId: bigint, accept: boolean): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchArticles(queryText: string): Promise<Array<Article>>;
    setActivePuzzle(id: bigint): Promise<void>;
    submitArticleForReview(articleId: bigint): Promise<void>;
    unfeatureArticle(articleId: bigint): Promise<void>;
    unpublishArticle(articleId: bigint): Promise<void>;
    updateArticle(articleId: bigint, title: string, author: string, organizationId: bigint | null, publicationDate: string, imageBlobIds: Array<string>, bodyContent: string, tags: Array<string>): Promise<void>;
    updateOrg(orgId: bigint, name: string, slug: string, description: string, logoBlobId: string | null, bannerBlobId: string | null): Promise<void>;
    updatePuzzle(id: bigint, title: string, gridWidth: bigint, gridHeight: bigint, cells: Array<CrosswordCell>, clues: Array<CrosswordClue>): Promise<void>;
}
