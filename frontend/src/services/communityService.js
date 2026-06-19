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

export const cleanCommunityText = (value = "") =>
  value.trim().replace(/\s+/g, " ");

const normalizeLocation = (location) => {
  if (
    location?.lat === undefined ||
    location?.lat === null ||
    location?.lat === "" ||
    location?.lng === undefined ||
    location?.lng === null ||
    location?.lng === ""
  ) {
    return null;
  }

  const lat = Number(location?.lat);
  const lng = Number(location?.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return { lat, lng };
};

const getOsmExternalId = (result) =>
  result?.osm_type && result?.osm_id
    ? `${result.osm_type}/${result.osm_id}`
    : "";

export const toCommunitySummary = (community) => {
  if (!community) {
    return null;
  }

  const location = normalizeLocation(community.location);
  const name = cleanCommunityText(
    community.name || community.displayName || community.activeCommunity || ""
  );

  return {
    communityId: community.communityId || community.id || "",
    name,
    nameLower: normalizeCommunityName(name),
    displayName: cleanCommunityText(community.displayName || name),
    area: cleanCommunityText(community.area || ""),
    state: cleanCommunityText(community.state || ""),
    country: cleanCommunityText(community.country || "Malaysia"),
    type: cleanCommunityText(community.type || ""),
    source: cleanCommunityText(community.source || ""),
    externalId: cleanCommunityText(community.externalId || ""),
    ...(location ? { location } : {}),
  };
};

export const toUserCommunitySummary = (community) => {
  const summary = toCommunitySummary(community);

  if (!summary) {
    return null;
  }

  return {
    communityId: summary.communityId,
    name: summary.name,
    area: summary.area,
    state: summary.state,
    country: summary.country,
    type: summary.type,
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

  return details.length
    ? `${summary.name} - ${details.join(", ")}`
    : summary.name;
};

export const getCommunityLocationLabel = (community) => {
  const summary = toCommunitySummary(community);

  return (
    [summary?.area, summary?.state, summary?.country]
      .filter(Boolean)
      .join(", ") || "Area not specified"
  );
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
    return communities.slice(0, 8);
  }

  return communities
    .filter((community) =>
      [
        community.name,
        community.displayName,
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
    .slice(0, 8);
};

const findCommunityByExternalId = async (externalId) => {
  if (!externalId) {
    return null;
  }

  const externalQuery = query(
    collection(db, "communities"),
    where("externalId", "==", externalId)
  );
  const externalSnapshot = await getDocs(externalQuery);

  if (externalSnapshot.empty) {
    return null;
  }

  const communityDoc = externalSnapshot.docs.find(
    (result) => result.data().source === "osm"
  );

  if (!communityDoc) {
    return null;
  }

  return toCommunitySummary({
    communityId: communityDoc.id,
    ...communityDoc.data(),
  });
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

const getOsmArea = (result) => {
  const address = result.address || {};

  return cleanCommunityText(
    address.suburb ||
      address.neighbourhood ||
      address.quarter ||
      address.city_district ||
      address.district ||
      address.town ||
      address.city ||
      address.village ||
      ""
  );
};

export const normalizeOsmCommunity = (result) => {
  const address = result?.address || {};
  const rawName = cleanCommunityText(result?.name || "");
  const rawDisplayName = cleanCommunityText(result?.display_name || "");

  if (!rawName && !rawDisplayName) {
    return null;
  }

  const name =
    rawName ||
    cleanCommunityText(rawDisplayName.split(",")[0]) ||
    "Unnamed community";
  const location = normalizeLocation({
    lat: result?.lat,
    lng: result?.lon,
  });

  return toCommunitySummary({
    name,
    displayName: rawDisplayName || name,
    area: getOsmArea(result),
    state: address.state || address.region || address.county || "",
    country: address.country || "Malaysia",
    type: result?.type || result?.class || address._type || "Community",
    source: "osm",
    externalId: getOsmExternalId(result),
    ...(location ? { location } : {}),
  });
};

export const toOsmCommunityDraft = normalizeOsmCommunity;

export const searchOsmCommunities = async (searchTerm = "") => {
  const normalizedSearch = cleanCommunityText(searchTerm);

  if (!normalizedSearch) {
    return [];
  }

  const params = new URLSearchParams({
    q: normalizedSearch,
    format: "json",
    addressdetails: "1",
    limit: "5",
    countrycodes: "my",
  });
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error("OpenStreetMap search is unavailable right now.");
  }

  const results = await response.json();

  return results
    .map(normalizeOsmCommunity)
    .filter((community) => community?.name)
    .slice(0, 5);
};

const buildDuplicateError = (duplicate) => {
  const error = new Error(
    duplicate.exact
      ? `A community named ${duplicate.community.name} already exists. Please join it instead.`
      : `A similar community already exists: ${getCommunityLabel(
          duplicate.community
        )}. Please join it if this is your community.`
  );

  error.duplicateCommunity = duplicate.community;
  return error;
};

const createOsmCommunity = async ({ community, user }) => {
  if (!user?.uid) {
    throw new Error("Please sign in before creating a community.");
  }

  const summary = toCommunitySummary(community);

  if (!summary?.name) {
    throw new Error(
      "This place could not be prepared as a community. Please choose another result."
    );
  }

  const existingExternal = await findCommunityByExternalId(summary.externalId);

  if (existingExternal) {
    return existingExternal;
  }

  const duplicate = await findDuplicateCommunity(summary.name);

  if (duplicate) {
    return duplicate.community;
  }

  const docRef = await addDoc(collection(db, "communities"), {
    name: summary.name,
    nameLower: normalizeCommunityName(summary.name),
    displayName: summary.displayName || summary.name,
    area: summary.area,
    state: summary.state,
    country: summary.country,
    type: summary.type || "Residential Area",
    active: true,
    createdAt: serverTimestamp(),
    createdBy: user.uid,
    source: "osm",
    externalId: summary.externalId,
    ...(summary.location ? { location: summary.location } : {}),
    requiresInvite: false,
    inviteCode: "",
  });

  return toCommunitySummary({
    ...summary,
    communityId: docRef.id,
  });
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

  if (!name || !area || !state || !country || !type) {
    throw new Error("Please fill in all community fields.");
  }

  const duplicate = await findDuplicateCommunity(name);

  if (duplicate) {
    throw buildDuplicateError(duplicate);
  }

  const docRef = await addDoc(collection(db, "communities"), {
    name,
    nameLower: normalizeCommunityName(name),
    area,
    state,
    country,
    type,
    active: true,
    createdAt: serverTimestamp(),
    createdBy: user.uid,
    source: "manual",
    requiresInvite: false,
    inviteCode: "",
  });

  return toCommunitySummary({
    communityId: docRef.id,
    name,
    area,
    state,
    country,
    type,
    source: "manual",
  });
};

export const ensureCommunityForUser = async ({ community, user }) => {
  if (!community) {
    throw new Error("Please select a community before continuing.");
  }

  const summary = toCommunitySummary(community);

  if (!summary?.name) {
    throw new Error(
      "This place could not be prepared as a community. Please choose another result."
    );
  }

  if (summary.communityId) {
    return summary;
  }

  if (summary.source === "osm") {
    return createOsmCommunity({ community: summary, user });
  }

  return createCommunity({ community: summary, user });
};
