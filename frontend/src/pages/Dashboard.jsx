import MarketplaceView from "../components/marketplace/MarketplaceView";

function Dashboard({
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

export default Dashboard;
