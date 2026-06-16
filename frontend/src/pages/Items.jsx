import MarketplaceView from "../components/marketplace/MarketplaceView";

function Items({
  activeCommunity,
  activeCommunityId,
  activeCommunityObject,
  listIntent,
  onSearchChange,
  searchTerm,
  user,
  userProfile,
}) {
  return (
    <MarketplaceView
      activeCommunity={activeCommunity}
      activeCommunityId={activeCommunityId}
      activeCommunityObject={activeCommunityObject}
      key={listIntent}
      listIntent={listIntent}
      onSearchChange={onSearchChange}
      searchTerm={searchTerm}
      user={user}
      userProfile={userProfile}
    />
  );
}

export default Items;
