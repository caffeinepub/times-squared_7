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

  type OrgInviteStatus = {
    #pending;
    #accepted;
    #declined;
  };

  type OrgInvite = {
    inviteId : Nat;
    orgId : Nat;
    invitedPrincipal : Principal;
    invitedByPrincipal : Principal;
    status : OrgInviteStatus;
    createdAt : Int;
  };

  type OrgMembership = {
    orgId : Nat;
    memberPrincipal : Principal;
    joinedAt : Int;
  };

  // SubmissionStatus is kept stable (no new variants to avoid migration issues).
  // "Published" state is derived from article.isPublished on the frontend.
  type SubmissionStatus = {
    #draft;
    #pending_review;
    #rejected;
  };

  type ArticleSubmission = {
    articleId : Nat;
    submissionStatus : SubmissionStatus;
    rejectionNote : ?Text;
    submittedAt : ?Int;
  };

  type SubmissionWithArticle = {
    article : Article;
    submission : ArticleSubmission;
  };

  // State
  include MixinStorage();
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  stable var articleIdCounter = 0;
  stable var orgIdCounter = 0;
  stable var inviteIdCounter = 0;

  // stable var ensures superAdmin principal survives canister upgrades
  stable var superAdmin : ?Principal = null;
  stable var orgOwners = Map.empty<Nat, Principal>();

  // Storage
  stable var articles = Map.empty<Nat, Article>();
  stable var userProfiles = Map.empty<Principal, UserProfile>();
  stable var organizations = Map.empty<Nat, OrgSection>();
  stable var orgInvites = Map.empty<Nat, OrgInvite>();
  stable var orgMemberships = Map.empty<Text, OrgMembership>();
  stable var articleSubmissions = Map.empty<Nat, ArticleSubmission>();

  // === HELPER FUNCTIONS ===

  func isSuperAdmin(caller : Principal) : Bool {
    switch (superAdmin) {
      case (?admin) { admin == caller };
      case (null) { false };
    };
  };

  func isOrgOwner(caller : Principal, orgId : Nat) : Bool {
    switch (orgOwners.get(orgId)) {
      case (?owner) { owner == caller };
      case (null) { false };
    };
  };

  func validateSuperAdminOrOrgOwner(caller : Principal, orgId : Nat) {
    if (not isSuperAdmin(caller) and not isOrgOwner(caller, orgId)) {
      Runtime.trap("Unauthorized: Only super admin or organization owner can perform this action");
    };
  };

  func getOwnedOrgIds(caller : Principal) : [Nat] {
    let ownedOrgs = List.empty<Nat>();
    for ((orgId, owner) in orgOwners.entries()) {
      if (owner == caller) {
        ownedOrgs.add(orgId);
      };
    };
    ownedOrgs.toArray();
  };

  func isOrgMemberLocal(caller : Principal, orgId : Nat) : Bool {
    let key = orgId.toText() # "_" # caller.toText();
    orgMemberships.get(key) != null;
  };

  // Strip HTML tags from a string and return plain text truncated to maxLen chars.
  // Used to generate clean excerpts from rich-text HTML body content.
  func extractPlainTextExcerpt(html : Text, maxLen : Nat) : Text {
    var plain = "";
    var inTag = false;
    for (c in html.chars()) {
      if (c == '<') {
        inTag := true;
      } else if (c == '>') {
        inTag := false;
      } else if (not inTag) {
        plain #= Text.fromChar(c);
      };
    };
    // Trim leading/trailing whitespace chars
    let trimmed = plain.trimStart(#predicate(func(c) { c == ' ' or c == '\n' or c == '\t' })).trimEnd(#predicate(func(c) { c == ' ' or c == '\n' or c == '\t' }));
    if (trimmed.size() > maxLen) {
      var i = 0;
      var truncated = "";
      for (c in trimmed.chars()) {
        if (i < maxLen) {
          truncated #= Text.fromChar(c);
          i += 1;
        };
      };
      truncated;
    } else {
      trimmed;
    };
  };

  // === SUPER ADMIN FUNCTIONS ===

  public shared ({ caller }) func claimSuperAdmin() : async () {
    switch (superAdmin) {
      case (null) {
        superAdmin := ?caller;
        // Directly assign #admin role; bypassing token comparison that would incorrectly register as #user
        accessControlState.userRoles.add(caller, #admin);
        accessControlState.adminAssigned := true;
      };
      case (_) { Runtime.trap("Super admin already claimed") };
    };
  };

  public query func getSuperAdmin() : async ?Principal {
    superAdmin;
  };

  // === ORG MEMBERSHIP EVENTS ===

  public shared ({ caller }) func inviteUserToOrg(orgId : Nat, userPrincipal : Principal) : async () {
    validateSuperAdminOrOrgOwner(caller, orgId);

    switch (organizations.get(orgId)) {
      case (null) { Runtime.trap("Organization does not exist: " # orgId.toText()) };
      case (?_) {};
    };

    // Bug fix: removed user profile existence check so admins can invite
    // any valid principal, even before the user has logged in.

    let membershipKey = orgId.toText() # "_" # userPrincipal.toText();
    switch (orgMemberships.get(membershipKey)) {
      case (null) {};
      case (?_) { Runtime.trap("User is already a member of this organization") };
    };

    for ((_, invite) in orgInvites.entries()) {
      if (invite.orgId == orgId and invite.invitedPrincipal == userPrincipal and invite.status == #pending) {
        Runtime.trap("User already has a pending invite for this organization. Please check your invites.");
      };
    };

    let newInvite : OrgInvite = {
      inviteId = inviteIdCounter;
      orgId;
      invitedPrincipal = userPrincipal;
      invitedByPrincipal = caller;
      status = #pending;
      createdAt = Time.now();
    };

    orgInvites.add(inviteIdCounter, newInvite);
    inviteIdCounter += 1;
  };

  public shared ({ caller }) func respondToOrgInvite(inviteId : Nat, accept : Bool) : async () {
    switch (orgInvites.get(inviteId)) {
      case (null) { Runtime.trap("Invite not found") };
      case (?invite) {
        if (invite.invitedPrincipal != caller) {
          Runtime.trap("Unauthorized: Only the invited user can respond to this invite");
        };

        if (invite.status != #pending) {
          Runtime.trap("Invite has already been responded to");
        };

        let updatedInvite = { invite with status = if (accept) { #accepted } else { #declined } };
        orgInvites.add(inviteId, updatedInvite);

        if (accept) {
          let membershipKey = invite.orgId.toText() # "_" # caller.toText();
          let newMembership : OrgMembership = {
            orgId = invite.orgId;
            memberPrincipal = caller;
            joinedAt = Time.now();
          };
          orgMemberships.add(membershipKey, newMembership);
        };
      };
    };
  };

  public query ({ caller }) func getMyInvites() : async [OrgInvite] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get invites");
    };

    let invites = orgInvites.values().filter(
     func(invite) { invite.invitedPrincipal == caller and invite.status == #pending }
    );
    invites.toArray();
  };

  public query ({ caller }) func getOrgMembers(orgId : Nat) : async [OrgMembership] {
    validateSuperAdminOrOrgOwner(caller, orgId);

    let orgMembers = orgMemberships.values().filter(
      func(membership) { membership.orgId == orgId }
    );
    orgMembers.toArray();
  };

  public shared ({ caller }) func removeOrgMember(orgId : Nat, memberPrincipal : Principal) : async () {
    validateSuperAdminOrOrgOwner(caller, orgId);
    let membershipKey = orgId.toText() # "_" # memberPrincipal.toText();
    switch (orgMemberships.get(membershipKey)) {
      case (null) { Runtime.trap("Member not found in organization") };
      case (?_) {
        orgMemberships.remove(membershipKey);
      };
    };
  };

  public query ({ caller }) func getMyMemberships() : async [OrgMembership] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get memberships");
    };

    let memberships = orgMemberships.values().filter(
      func(membership) { membership.memberPrincipal == caller }
    );
    memberships.toArray();
  };

  public query func isOrgMember(orgId : Nat, user : Principal) : async Bool {
    let membershipKey = orgId.toText() # "_" # user.toText();
    orgMemberships.get(membershipKey) != null;
  };

  // === ORG MANAGEMENT ===

  public shared ({ caller }) func createOrg(
    name : Text,
    slug : Text,
    description : Text,
    logoBlobId : ?Text,
    bannerBlobId : ?Text,
  ) : async Nat {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create organizations");
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
    orgOwners.add(orgIdCounter, caller);
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
    validateSuperAdminOrOrgOwner(caller, orgId);
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
    validateSuperAdminOrOrgOwner(caller, orgId);
    organizations.remove(orgId);
    orgOwners.remove(orgId);
  };

  public query ({ caller }) func getMyOrgs() : async [OrgSection] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view their organizations");
    };

    if (isSuperAdmin(caller)) {
      return organizations.values().toArray();
    };

    let ownedOrgIds = getOwnedOrgIds(caller);
    let myOrgs = List.empty<OrgSection>();
    for (orgId in ownedOrgIds.values()) {
      switch (organizations.get(orgId)) {
        case (?org) { myOrgs.add(org) };
        case (null) {};
      };
    };
    myOrgs.toArray();
  };

  // === ARTICLE MANAGEMENT ===

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
    switch (organizationId) {
      case (?orgId) {
        let isAdminOrOwner = isSuperAdmin(caller) or isOrgOwner(caller, orgId);
        let isMember = isOrgMemberLocal(caller, orgId);
        if (not isAdminOrOwner and not isMember) {
          Runtime.trap("Unauthorized: Must be org owner, super admin, or org member to create articles");
        };
      };
      case (null) {
        if (not (AccessControl.isAdmin(accessControlState, caller))) {
          Runtime.trap("Unauthorized: Only admins can create articles");
        };
      };
    };

    let excerpt = extractPlainTextExcerpt(bodyContent, 200);

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

    switch (organizationId) {
      case (?orgId) {
        let isAdminOrOwner = isSuperAdmin(caller) or isOrgOwner(caller, orgId);
        if (not isAdminOrOwner) {
          let submission : ArticleSubmission = {
            articleId = articleIdCounter;
            submissionStatus = #draft;
            rejectionNote = null;
            submittedAt = null;
          };
          articleSubmissions.add(articleIdCounter, submission);
        };
      };
      case (null) {};
    };

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
    switch (articles.get(articleId)) {
      case (null) { Runtime.trap("Article not found") };
      case (?existingArticle) {
        let isAuthor = switch (existingArticle.authorPrincipal) {
          case (?ap) { ap == caller };
          case (null) { false };
        };

        if (not isAuthor) {
          switch (existingArticle.organizationId) {
            case (?orgId) {
              validateSuperAdminOrOrgOwner(caller, orgId);
            };
            case (null) {
              if (not (AccessControl.isAdmin(accessControlState, caller))) {
                Runtime.trap("Unauthorized: Only admins can update this article");
              };
            };
          };
        };

        let excerpt = extractPlainTextExcerpt(bodyContent, 200);

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

        switch (articleSubmissions.get(articleId)) {
          case (?sub) {
            // Bug fix: if org changed, remove the orphaned submission
            if (existingArticle.organizationId != organizationId) {
              articleSubmissions.remove(articleId);
            } else if (sub.submissionStatus == #rejected) {
              // Reset rejected submission to draft after author edits
              let resetSub = { sub with submissionStatus = #draft; rejectionNote = null };
              articleSubmissions.add(articleId, resetSub);
            };
          };
          case (null) {};
        };
      };
    };
  };

  public shared ({ caller }) func publishArticle(articleId : Nat) : async () {
    switch (articles.get(articleId)) {
      case (null) { Runtime.trap("Article not found") };
      case (?existingArticle) {
        switch (existingArticle.organizationId) {
          case (?orgId) {
            validateSuperAdminOrOrgOwner(caller, orgId);
          };
          case (null) {
            if (not (AccessControl.isAdmin(accessControlState, caller))) {
              Runtime.trap("Unauthorized: Only admins can publish this article");
            };
          };
        };
        let updatedArticle = { existingArticle with isPublished = true };
        articles.add(articleId, updatedArticle);
      };
    };
  };

  public shared ({ caller }) func unpublishArticle(articleId : Nat) : async () {
    switch (articles.get(articleId)) {
      case (null) { Runtime.trap("Article not found") };
      case (?existingArticle) {
        let isAuthor = switch (existingArticle.authorPrincipal) {
          case (?ap) { ap == caller };
          case (null) { false };
        };

        if (not isAuthor and not isSuperAdmin(caller)) {
          Runtime.trap("Unauthorized: Only the original author or super admin can unpublish an article");
        };

        let updatedArticle = { existingArticle with isPublished = false };
        articles.add(articleId, updatedArticle);
      };
    };
  };

  public shared ({ caller }) func deleteArticle(articleId : Nat) : async () {
    switch (articles.get(articleId)) {
      case (null) { Runtime.trap("Article not found") };
      case (?existingArticle) {
        let isAuthor = switch (existingArticle.authorPrincipal) {
          case (?ap) { ap == caller };
          case (null) { false };
        };

        if (not isAuthor) {
          switch (existingArticle.organizationId) {
            case (?orgId) {
              validateSuperAdminOrOrgOwner(caller, orgId);
            };
            case (null) {
              if (not (AccessControl.isAdmin(accessControlState, caller))) {
                Runtime.trap("Unauthorized: Only admins can delete this article");
              };
            };
          };
        };

        articles.remove(articleId);
        articleSubmissions.remove(articleId);
      };
    };
  };

  public shared ({ caller }) func featureArticle(articleId : Nat) : async () {
    switch (articles.get(articleId)) {
      case (null) { Runtime.trap("Article not found") };
      case (?existingArticle) {
        switch (existingArticle.organizationId) {
          case (?orgId) {
            validateSuperAdminOrOrgOwner(caller, orgId);
          };
          case (null) {
            if (not (AccessControl.isAdmin(accessControlState, caller))) {
              Runtime.trap("Unauthorized: Only admins can feature this article");
            };
          };
        };

        for ((id, article) in articles.entries()) {
          if (article.isFeatured) {
            articles.add(id, { article with isFeatured = false });
          };
        };

        let updatedArticle = { existingArticle with isFeatured = true };
        articles.add(articleId, updatedArticle);
      };
    };
  };

  public shared ({ caller }) func unfeatureArticle(articleId : Nat) : async () {
    switch (articles.get(articleId)) {
      case (null) { Runtime.trap("Article not found") };
      case (?existingArticle) {
        switch (existingArticle.organizationId) {
          case (?orgId) {
            validateSuperAdminOrOrgOwner(caller, orgId);
          };
          case (null) {
            if (not (AccessControl.isAdmin(accessControlState, caller))) {
              Runtime.trap("Unauthorized: Only admins can unfeature this article");
            };
          };
        };

        let updatedArticle = { existingArticle with isFeatured = false };
        articles.add(articleId, updatedArticle);
      };
    };
  };

  // === B2: SUBMISSION WORKFLOW ===

  public shared ({ caller }) func submitArticleForReview(articleId : Nat) : async () {
    switch (articles.get(articleId)) {
      case (null) { Runtime.trap("Article not found") };
      case (?article) {
        switch (article.authorPrincipal) {
          case (?ap) {
            if (ap != caller) {
              Runtime.trap("Unauthorized: Only the original author can submit this article");
            };
          };
          case (null) {
            Runtime.trap("Unauthorized: Article has no author assigned");
          };
        };

        switch (articleSubmissions.get(articleId)) {
          case (null) { Runtime.trap("Article is not a contributor submission") };
          case (?sub) {
            if (sub.submissionStatus == #pending_review) {
              Runtime.trap("Article is already pending review");
            };
            let updated = { sub with submissionStatus = #pending_review; submittedAt = ?Time.now() };
            articleSubmissions.add(articleId, updated);
          };
        };
      };
    };
  };

  // Bug fix: validate pending_review status before approving;
  // keep the submission entry so contributors can see their approved work
  // (frontend derives "published" state from article.isPublished)
  public shared ({ caller }) func approveArticleSubmission(articleId : Nat) : async () {
    switch (articles.get(articleId)) {
      case (null) { Runtime.trap("Article not found") };
      case (?article) {
        switch (article.organizationId) {
          case (?orgId) {
            validateSuperAdminOrOrgOwner(caller, orgId);
          };
          case (null) {
            Runtime.trap("Article does not belong to an organization");
          };
        };

        switch (articleSubmissions.get(articleId)) {
          case (null) { Runtime.trap("Article is not a contributor submission") };
          case (?sub) {
            if (sub.submissionStatus != #pending_review) {
              Runtime.trap("Cannot approve: article must be in pending review status");
            };
            // Publish the article; keep submission entry so contributor sees it
            let published = { article with isPublished = true };
            articles.add(articleId, published);
            // Submission entry stays — frontend uses article.isPublished to show "Published" badge
          };
        };
      };
    };
  };

  public shared ({ caller }) func rejectArticleSubmission(articleId : Nat, note : ?Text) : async () {
    switch (articles.get(articleId)) {
      case (null) { Runtime.trap("Article not found") };
      case (?article) {
        switch (article.organizationId) {
          case (?orgId) {
            validateSuperAdminOrOrgOwner(caller, orgId);
          };
          case (null) {
            Runtime.trap("Article does not belong to an organization");
          };
        };

        switch (articleSubmissions.get(articleId)) {
          case (null) { Runtime.trap("Article is not a contributor submission") };
          case (?sub) {
            let updated = { sub with submissionStatus = #rejected; rejectionNote = note };
            articleSubmissions.add(articleId, updated);
          };
        };
      };
    };
  };

  public query ({ caller }) func getMySubmissions() : async [SubmissionWithArticle] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get submissions");
    };

    let result = List.empty<SubmissionWithArticle>();
    for ((articleId, sub) in articleSubmissions.entries()) {
      switch (articles.get(articleId)) {
        case (?article) {
          let isAuthor = switch (article.authorPrincipal) {
            case (?ap) { ap == caller };
            case (null) { false };
          };
          if (isAuthor) {
            result.add({ article; submission = sub });
          };
        };
        case (null) {};
      };
    };
    result.toArray();
  };

  // Bug fix: exclude already-published articles from the pending queue
  public query ({ caller }) func getPendingSubmissions(orgId : Nat) : async [SubmissionWithArticle] {
    validateSuperAdminOrOrgOwner(caller, orgId);

    let result = List.empty<SubmissionWithArticle>();
    for ((articleId, sub) in articleSubmissions.entries()) {
      if (sub.submissionStatus == #pending_review) {
        switch (articles.get(articleId)) {
          case (?article) {
            // Only show articles that are still unpublished (not yet approved)
            if (article.organizationId == ?orgId and not article.isPublished) {
              result.add({ article; submission = sub });
            };
          };
          case (null) {};
        };
      };
    };
    result.toArray();
  };

  // === ARTICLE QUERIES ===

  public query ({ caller }) func getAllArticles() : async [Article] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all articles");
    };

    if (isSuperAdmin(caller)) {
      return articles.values().toArray().sort();
    };

    // Bug fix: regular admins see their org articles AND their own no-org articles
    let ownedOrgIds = getOwnedOrgIds(caller);
    let myArticles = List.empty<Article>();
    for (article in articles.values()) {
      switch (article.organizationId) {
        case (?orgId) {
          if (ownedOrgIds.find<Nat>(func(id) { id == orgId }) != null) {
            myArticles.add(article);
          };
        };
        case (null) {
          switch (article.authorPrincipal) {
            case (?ap) {
              if (ap == caller) { myArticles.add(article) };
            };
            case (null) {};
          };
        };
      };
    };
    myArticles.toArray().sort();
  };

  public query ({ caller }) func getOrgArticles(orgId : Nat) : async [Article] {
    validateSuperAdminOrOrgOwner(caller, orgId);
    articles.values().filter(
      func(article) { article.organizationId == ?orgId }
    ).toArray().sort();
  };

  // === PUBLIC QUERIES ===

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

  public query func getOrgs() : async [OrgSection] {
    organizations.values().toArray();
  };

  // Bug fix: return ?OrgSection so the frontend can handle missing orgs gracefully
  public query func getOrgById(orgId : Nat) : async ?OrgSection {
    organizations.get(orgId);
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

  // === USER PROFILE MANAGEMENT ===

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query func getUserProfile(user : Principal) : async ?UserProfile {
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    let safeProfile = { profile with principal = caller };
    userProfiles.add(caller, safeProfile);
  };
};
