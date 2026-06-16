import {
  addDoc,
  collection,
  getDocs,
  limit,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

export const communityTypes = [
  "Condominium",
  "Apartment",
  "Residential Area",
  "Student Housing",
  "Other",
];

export const normalizeCommunityName = (name = "") =>
  name.trim().toLowerCase().replace(/\s+/g, " ");

const compactCommunityName = (name = "") =>
  normalizeCommunityName(name).replace(/[^a-z0-9]/g, "");

export const cleanCommunityText = (value = "") => value.trim().replace(/\s+/g, " ");

const normalizeLocation = (location) => {
  const lat = Number(location?.lat);
  const lng = Number(location?.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return { lat, lng };
};

export const toCommunitySummary = (community) => {
  if (!community) {
    return null;
  }

  const location = normalizeLocation(community.location);

  return {
    communityId: community.communityId || community.id || "",
    name: cleanCommunityText(community.name || community.activeCommunity || ""),
    area: cleanCommunityText(community.area || ""),
    state: cleanCommunityText(community.state || ""),
    country: cleanCommunityText(community.country || "Malaysia"),
    type: cleanCommunityText(community.type || ""),
    ...(location ? { location } : {}),
  };
};

export const getCommunityName = (community) =>
  typeof community === "string" ? community : community?.name || "";

export const getCommunityLabel = (community) => {
  const summary = toCommunitySummary(community);

  if (!summary?.name) {
    return "";
  }

  const details = [summary.area, summary.state, summary.type].filter(Boolean);

  return details.length ? `${summary.name} - ${details.join(", ")}` : summary.name;
};

export const getActiveCommunities = async () => {
  const communitiesQuery = query(
    collection(db, "communities"),
    where("active", "==", true)
  );
  const snapshot = await getDocs(communitiesQuery);

  return snapshot.docs
    .map((communityDoc) =>
      toCommunitySummary({
        communityId: communityDoc.id,
        ...communityDoc.data(),
      })
    )
    .filter((community) => community?.name)
    .sort((first, second) => first.name.localeCompare(second.name));
};

export const searchActiveCommunities = async (searchTerm = "") => {
  const normalizedSearch = normalizeCommunityName(searchTerm);
  const communities = await getActiveCommunities();

  if (!normalizedSearch) {
    return communities.slice(0, 12);
  }

  return communities
    .filter((community) =>
      [
        community.name,
        community.area,
        community.state,
        community.country,
        community.type,
      ]
        .filter(Boolean)
        .some((value) =>
          normalizeCommunityName(value).includes(normalizedSearch)
        )
    )
    .slice(0, 12);
};

export const findDuplicateCommunity = async (name) => {
  const normalizedName = normalizeCommunityName(name);

  if (!normalizedName) {
    return null;
  }

  const exactQuery = query(
    collection(db, "communities"),
    where("nameLower", "==", normalizedName),
    limit(1)
  );
  const exactSnapshot = await getDocs(exactQuery);

  if (!exactSnapshot.empty) {
    const communityDoc = exactSnapshot.docs[0];

    return {
      community: toCommunitySummary({
        communityId: communityDoc.id,
        ...communityDoc.data(),
      }),
      exact: true,
    };
  }

  const compactName = compactCommunityName(name);
  const activeCommunities = await getActiveCommunities();
  const similarCommunity = activeCommunities.find((community) => {
    const compactExisting = compactCommunityName(community.name);

    return (
      compactExisting &&
      compactName &&
      (compactExisting === compactName ||
        compactExisting.includes(compactName) ||
        compactName.includes(compactExisting))
    );
  });

  return similarCommunity
    ? { community: similarCommunity, exact: false }
    : null;
};

export const createCommunity = async ({ community, user }) => {
  if (!user?.uid) {
    throw new Error("Please sign in before creating a community.");
  }

  const name = cleanCommunityText(community.name);
  const area = cleanCommunityText(community.area);
  const state = cleanCommunityText(community.state);
  const country = cleanCommunityText(community.country || "Malaysia");
  const type = cleanCommunityText(community.type);
  const location = normalizeLocation(community.location);

  if (!name || !area || !state || !country || !type) {
    throw new Error("Please fill in all community fields.");
  }

  const duplicate = await findDuplicateCommunity(name);

  if (duplicate) {
    const error = new Error(
      duplicate.exact
        ? `A community named ${duplicate.community.name} already exists. Please join it instead.`
        : `A similar community already exists: ${getCommunityLabel(
            duplicate.community
          )}. Please join it if this is your community.`
    );
    error.duplicateCommunity = duplicate.community;
    throw error;
  }

  const communityData = {
    name,
    nameLower: normalizeCommunityName(name),
    area,
    state,
    country,
    type,
    active: true,
    createdAt: serverTimestamp(),
    createdBy: user.uid,
    requiresInvite: false,
    inviteCode: "",
  };

  if (location) {
    communityData.location = location;
  }

  const docRef = await addDoc(collection(db, "communities"), communityData);

  return toCommunitySummary({
    communityId: docRef.id,
    name,
    area,
    state,
    country,
    type,
    location,
  });
};

export const ensureCommunityForUser = async ({ community, user }) => {
  const summary = toCommunitySummary(community);

  if (!summary?.name) {
    throw new Error("Please select or create your community.");
  }

  if (summary.communityId) {
    return summary;
  }

  return createCommunity({ community: summary, user });
};
