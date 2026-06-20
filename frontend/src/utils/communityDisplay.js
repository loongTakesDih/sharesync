export const getCommunityDisplayName = (community) => {
  if (typeof community === "string") {
    return community.trim() || "Community not set";
  }

  return (
    community?.name ||
    community?.displayName ||
    community?.area ||
    "Community not set"
  );
};

export const getProfileCommunities = (profile = {}) => {
  const communities = Array.isArray(profile.communities)
    ? profile.communities
    : [];
  const seen = new Set();

  return communities
    .map((community) => ({
      community,
      label: getCommunityDisplayName(community),
    }))
    .filter(({ label }) => label !== "Community not set")
    .filter(({ community, label }) => {
      const key = community?.communityId || label.toLowerCase();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
};

export const getProfileActiveCommunity = (profile = {}) => {
  const communities = getProfileCommunities(profile);
  const activeById = communities.find(
    ({ community }) =>
      profile.activeCommunityId &&
      community?.communityId === profile.activeCommunityId
  );

  if (activeById) {
    return activeById.label;
  }

  const storedActiveCommunity = getCommunityDisplayName(
    profile.activeCommunity
  );

  return storedActiveCommunity !== "Community not set"
    ? storedActiveCommunity
    : communities[0]?.label || "Community not set";
};
