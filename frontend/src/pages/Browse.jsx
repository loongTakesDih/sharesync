import MarketplaceView from "../components/marketplace/MarketplaceView";

function Browse({
  activeCommunity,
  listIntent,
  onSearchChange,
  searchTerm,
  user,
  userProfile,
}) {
  return (
    <MarketplaceView
      activeCommunity={activeCommunity}
      key={listIntent}
      listIntent={listIntent}
      onSearchChange={onSearchChange}
      searchTerm={searchTerm}
      user={user}
      userProfile={userProfile}
    />
  );
}

export default Browse;
