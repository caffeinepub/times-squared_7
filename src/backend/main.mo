import Map "mo:core/Map";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Nat "mo:core/Nat";
import List "mo:core/List";
import Int "mo:core/Int";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";

actor {
  type Article = {
    id : Nat;
    title : Text;
    author : Text;
    authorPrincipal : ?Principal;
    organizationId : ?Nat;
    publicationDate : Text;
    heroImageBlobId : ?Text;
    heroImageBlobId2 : ?Text;
    bodyContent : Text;
    excerpt : Text;
    isPublished : Bool;
    isFeatured : Bool;
    tags : [Text];
    createdAt : Int;
  };

  module Article {
    public func compare(article1 : Article, article2 : Article) : Order.Order {
      Int.compare(article2.createdAt, article1.createdAt);
    };
  };

  type UserProfile = {
    principal : Principal;
    name : Text;
    bio : Text;
    avatarBlobId : ?Text;
    orgId : ?Nat;
  };

  type OrgSection = {
    id : Nat;
    name : Text;
    slug : Text;
    description : Text;
    logoBlobId : ?Text;
    bannerBlobId : ?Text;
    createdAt : Int;
  };

  // State
  include MixinStorage();
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  var articleIdCounter = 0;
  var orgIdCounter = 0;

  // Storage
  let articles = Map.empty<Nat, Article>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let organizations = Map.empty<Nat, OrgSection>();

  // Article Functions
  public shared ({ caller }) func createArticle(
    title : Text,
    author : Text,
    authorPrincipal : ?Principal,
    organizationId : ?Nat,
    publicationDate : Text,
    heroImageBlobId : ?Text,
    heroImageBlobId2 : ?Text,
    bodyContent : Text,
    tags : [Text],
  ) : async Nat {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create articles");
    };

    let excerpt = if (bodyContent.size() > 200) {
      bodyContent.toArray().sliceToArray(0, 200).toText();
    } else {
      bodyContent;
    };

    let article : Article = {
      id = articleIdCounter;
      title;
      author;
      authorPrincipal;
      organizationId;
      publicationDate;
      heroImageBlobId;
      heroImageBlobId2;
      bodyContent;
      excerpt;
      isPublished = false;
      isFeatured = false;
      tags;
      createdAt = Time.now();
    };

    articles.add(articleIdCounter, article);
    articleIdCounter += 1;
    article.id;
  };

  public shared ({ caller }) func updateArticle(
    articleId : Nat,
    title : Text,
    author : Text,
    organizationId : ?Nat,
    publicationDate : Text,
    heroImageBlobId : ?Text,
    heroImageBlobId2 : ?Text,
    bodyContent : Text,
    tags : [Text],
  ) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update articles");
    };

    switch (articles.get(articleId)) {
      case (null) { Runtime.trap("Article not found") };
      case (?existingArticle) {
        let excerpt = if (bodyContent.size() > 200) {
          bodyContent.toArray().sliceToArray(0, 200).toText();
        } else {
          bodyContent;
        };

        let updatedArticle : Article = {
          id = existingArticle.id;
          title;
          author;
          authorPrincipal = existingArticle.authorPrincipal;
          organizationId;
          publicationDate;
          heroImageBlobId;
          heroImageBlobId2;
          bodyContent;
          excerpt;
          isPublished = existingArticle.isPublished;
          isFeatured = existingArticle.isFeatured;
          tags;
          createdAt = existingArticle.createdAt;
        };

        articles.add(articleId, updatedArticle);
      };
    };
  };

  public shared ({ caller }) func publishArticle(articleId : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can publish articles");
    };

    switch (articles.get(articleId)) {
      case (null) { Runtime.trap("Article not found") };
      case (?existingArticle) {
        let updatedArticle = { existingArticle with isPublished = true };
        articles.add(articleId, updatedArticle);
      };
    };
  };

  public shared ({ caller }) func unpublishArticle(articleId : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can unpublish articles");
    };

    switch (articles.get(articleId)) {
      case (null) { Runtime.trap("Article not found") };
      case (?existingArticle) {
        let updatedArticle = { existingArticle with isPublished = false };
        articles.add(articleId, updatedArticle);
      };
    };
  };

  public shared ({ caller }) func deleteArticle(articleId : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete articles");
    };
    articles.remove(articleId);
  };

  public shared ({ caller }) func featureArticle(articleId : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can feature articles");
    };

    // Unfeature all articles first
    let allArticles = articles.toArray();
    for ((id, article) in allArticles.values()) {
      let updatedArticle = { article with isFeatured = false };
      articles.add(id, updatedArticle);
    };

    // Feature the specified article
    switch (articles.get(articleId)) {
      case (null) { Runtime.trap("Article not found") };
      case (?existingArticle) {
        let updatedArticle = { existingArticle with isFeatured = true };
        articles.add(articleId, updatedArticle);
      };
    };
  };

  public shared ({ caller }) func unfeatureArticle(articleId : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can unfeature articles");
    };

    switch (articles.get(articleId)) {
      case (null) { Runtime.trap("Article not found") };
      case (?existingArticle) {
        let updatedArticle = { existingArticle with isFeatured = false };
        articles.add(articleId, updatedArticle);
      };
    };
  };

  // Query Functions
  public query func getPublishedArticles() : async [Article] {
    articles.values().filter(
      func(article) { article.isPublished }
    ).toArray().sort();
  };

  public query func getFeaturedArticle() : async ?Article {
    let featured = articles.values().filter(
      func(article) { article.isFeatured }
    );
    switch (featured.size()) {
      case (0) { null };
      case (_) {
        let articlesArray = featured.toArray();
        if (articlesArray.size() > 0) {
          ?articlesArray[0];
        } else {
          null;
        };
      };
    };
  };

  public query func getArticleById(articleId : Nat) : async Article {
    switch (articles.get(articleId)) {
      case (null) { Runtime.trap("Article not found") };
      case (?article) { article };
    };
  };

  public query func getArticlesByTag(tag : Text) : async [Article] {
    articles.values().filter(
      func(article) {
        article.isPublished and article.tags.find(func(t) { t == tag }) != null
      }
    ).toArray().sort();
  };

  public query func getArticlesByOrg(orgId : Nat) : async [Article] {
    articles.values().filter(
      func(article) { article.isPublished and article.organizationId == ?orgId }
    ).toArray().sort();
  };

  public query ({ caller }) func getAllArticles() : async [Article] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all articles");
    };
    articles.values().toArray().sort();
  };

  public query func searchArticles(queryText : Text) : async [Article] {
    articles.values().filter(
      func(article) {
        article.isPublished and (article.title.contains(#text queryText) or article.bodyContent.contains(#text queryText))
      }
    ).toArray().sort();
  };

  public query func getAuthorArticles(authorPrincipal : Principal) : async [Article] {
    let authorArticles = List.empty<Article>();
    for (article in articles.values()) {
      switch (article.authorPrincipal) {
        case (?principal) {
          if (principal == authorPrincipal) {
            authorArticles.add(article);
          };
        };
        case (null) {};
      };
    };
    authorArticles.toArray().sort();
  };

  // Org Section Functions
  public shared ({ caller }) func createOrg(
    name : Text,
    slug : Text,
    description : Text,
    logoBlobId : ?Text,
    bannerBlobId : ?Text,
  ) : async Nat {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create orgs");
    };

    let org : OrgSection = {
      id = orgIdCounter;
      name;
      slug;
      description;
      logoBlobId;
      bannerBlobId;
      createdAt = Time.now();
    };

    organizations.add(orgIdCounter, org);
    orgIdCounter += 1;
    org.id;
  };

  public shared ({ caller }) func updateOrg(
    orgId : Nat,
    name : Text,
    slug : Text,
    description : Text,
    logoBlobId : ?Text,
    bannerBlobId : ?Text,
  ) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update orgs");
    };

    switch (organizations.get(orgId)) {
      case (null) { Runtime.trap("Organization not found") };
      case (?existingOrg) {
        let updatedOrg : OrgSection = {
          id = existingOrg.id;
          name;
          slug;
          description;
          logoBlobId;
          bannerBlobId;
          createdAt = existingOrg.createdAt;
        };

        organizations.add(orgId, updatedOrg);
      };
    };
  };

  public shared ({ caller }) func deleteOrg(orgId : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete orgs");
    };
    organizations.remove(orgId);
  };

  public query func getOrgs() : async [OrgSection] {
    organizations.values().toArray();
  };

  public query func getOrgById(orgId : Nat) : async OrgSection {
    switch (organizations.get(orgId)) {
      case (null) { Runtime.trap("Organization not found") };
      case (?org) { org };
    };
  };

  // User Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  // Public read -- no auth check so author pages are visible to everyone
  public query func getUserProfile(user : Principal) : async ?UserProfile {
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    // Always save under the caller's own principal for security
    let safeProfile = { profile with principal = caller };
    userProfiles.add(caller, safeProfile);
  };
};
