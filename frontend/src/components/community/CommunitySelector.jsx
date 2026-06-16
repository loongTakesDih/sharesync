import { useEffect, useState } from "react";
import {
  communityTypes,
  ensureCommunityForUser,
  searchActiveCommunities,
  searchOsmCommunities,
  toCommunitySummary,
} from "../../services/communityService";
import { inputClass } from "../../utils/styles";

const initialDraft = {
  name: "",
  area: "",
  state: "",
  country: "Malaysia",
  type: "Condominium",
  source: "manual",
};

const modeButtonClass =
  "flex-1 rounded-xl px-3 py-2 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60";
const activeModeButtonClass = `${modeButtonClass} bg-slate-900 text-white shadow-sm`;
const inactiveModeButtonClass = `${modeButtonClass} bg-white text-slate-600 ring-1 ring-stone-200 hover:bg-emerald-50 hover:text-emerald-800`;
const resultButtonClass =
  "rounded-xl border border-stone-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/50 disabled:cursor-not-allowed disabled:opacity-60";
const selectedResultButtonClass =
  "rounded-xl border border-emerald-500 bg-emerald-50 px-4 py-3 text-left shadow-sm";

function CommunitySelector({
  disabled = false,
  onChange,
  selectedCommunity,
  user = null,
}) {
  const [mode, setMode] = useState("search");
  const [searchTerm, setSearchTerm] = useState("");
  const [shareSyncResults, setShareSyncResults] = useState([]);
  const [osmResults, setOsmResults] = useState([]);
  const [shareSyncLoading, setShareSyncLoading] = useState(false);
  const [osmLoading, setOsmLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState(initialDraft);
  const selected = toCommunitySummary(selectedCommunity);
  const busy = disabled || shareSyncLoading || osmLoading;

  const selectCommunity = (community, nextMessage = "") => {
    onChange(toCommunitySummary(community));
    setMessage(nextMessage);
  };

  const selectExistingCommunity = (community) => {
    selectCommunity(community, "Existing ShareSync community selected.");
  };

  const searchOsm = async () => {
    if (!searchTerm.trim()) {
      setMessage("Search your condominium, apartment, residence, or community.");
      return;
    }

    setOsmLoading(true);
    setMessage("");

    try {
      const results = await searchOsmCommunities(searchTerm);
      setOsmResults(results);

      if (results.length === 0) {
        setMessage(
          "No useful OpenStreetMap results found. You can create the community manually."
        );
      }
    } catch (error) {
      setMessage(error.message);
      setOsmResults([]);
    } finally {
      setOsmLoading(false);
    }
  };

  useEffect(() => {
    const trimmedSearch = searchTerm.trim();

    if (mode !== "search") {
      return undefined;
    }

    if (trimmedSearch.length < 2) {
      return undefined;
    }

    let active = true;

    const searchTimer = window.setTimeout(() => {
      searchActiveCommunities(trimmedSearch)
        .then((results) => {
          if (active) {
            setShareSyncResults(results);
          }
        })
        .catch((error) => {
          if (active) {
            setMessage(error.message);
            setShareSyncResults([]);
          }
        })
        .finally(() => {
          if (active) {
            setShareSyncLoading(false);
          }
        });
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(searchTimer);
    };
  }, [mode, searchTerm]);

  const updateSearchTerm = (value) => {
    const trimmedValue = value.trim();

    setSearchTerm(value);
    setMessage("");
    setOsmResults([]);

    if (trimmedValue.length < 2) {
      setShareSyncResults([]);
      setShareSyncLoading(false);
      return;
    }

    setShareSyncLoading(true);
  };

  const updateDraft = (field, value) => {
    setDraft((current) => {
      const nextDraft = {
        ...current,
        [field]: value,
      };

      if (nextDraft.name.trim()) {
        onChange(
          toCommunitySummary({
            ...nextDraft,
            communityId: "",
            source: "manual",
          })
        );
      }

      setMessage("");

      return nextDraft;
    });
  };

  const selectOsmResult = async (community) => {
    const osmCommunity = {
      ...community,
      communityId: "",
      source: "osm",
    };

    if (!user?.uid) {
      selectCommunity(
        osmCommunity,
        "OpenStreetMap result selected. ShareSync will create or join this community when your profile is saved."
      );
      return;
    }

    setOsmLoading(true);
    setMessage("");

    try {
      const joinedCommunity = await ensureCommunityForUser({
        community: osmCommunity,
        user,
      });
      selectCommunity(
        joinedCommunity,
        "OpenStreetMap result joined as a ShareSync community."
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setOsmLoading(false);
    }
  };

  return (
    <div className="grid gap-4 rounded-2xl border border-stone-200 bg-stone-50 p-3">
      <div className="flex rounded-2xl bg-stone-100 p-1">
        <button
          className={mode === "search" ? activeModeButtonClass : inactiveModeButtonClass}
          type="button"
          disabled={disabled}
          onClick={() => setMode("search")}
        >
          Find community
        </button>
        <button
          className={mode === "manual" ? activeModeButtonClass : inactiveModeButtonClass}
          type="button"
          disabled={disabled}
          onClick={() => setMode("manual")}
        >
          Create manually
        </button>
      </div>

      {selected?.name && <SelectedCommunityPreview selected={selected} />}

      {mode === "search" ? (
        <SearchCommunityPanel
          busy={busy}
          disabled={disabled}
          onSearchOsm={searchOsm}
          onSearchTermChange={updateSearchTerm}
          onSelectOsm={selectOsmResult}
          onSelectShareSync={selectExistingCommunity}
          osmLoading={osmLoading}
          osmResults={osmResults}
          searchTerm={searchTerm}
          selected={selected}
          shareSyncLoading={shareSyncLoading}
          shareSyncResults={shareSyncResults}
        />
      ) : (
        <ManualCommunityPanel
          disabled={disabled}
          draft={draft}
          onDraftChange={updateDraft}
        />
      )}

      {message && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          {message}
        </p>
      )}
    </div>
  );
}

function SearchCommunityPanel({
  busy,
  disabled,
  onSearchOsm,
  onSearchTermChange,
  onSelectOsm,
  onSelectShareSync,
  osmLoading,
  osmResults,
  searchTerm,
  selected,
  shareSyncLoading,
  shareSyncResults,
}) {
  const hasShareSyncResults = shareSyncResults.length > 0;
  const hasOsmResults = osmResults.length > 0;
  const hasSearchInput = searchTerm.trim().length >= 2;
  const searchedWithoutShareSyncResults = hasSearchInput && !hasShareSyncResults;

  return (
    <div className="grid gap-4">
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Search community
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <input
            className={inputClass}
            type="search"
            value={searchTerm}
            disabled={disabled}
            onChange={(event) => onSearchTermChange(event.target.value)}
          />
          <button
            className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold text-emerald-800 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            disabled={busy || searchTerm.trim().length === 0}
            onClick={onSearchOsm}
          >
            {osmLoading ? "Searching OSM..." : "Search with OSM"}
          </button>
        </div>
      </label>

      {(shareSyncLoading || hasSearchInput || hasShareSyncResults) && (
        <ExistingCommunityResults
          emptyText="No ShareSync community found for this search."
          loading={shareSyncLoading}
          loadingText="Searching ShareSync communities..."
          onSelect={onSelectShareSync}
          results={shareSyncResults}
          selected={selected}
        />
      )}

      {(osmLoading || hasOsmResults) && (
        <ResultSection
          emptyText={
            searchedWithoutShareSyncResults
              ? "No useful OpenStreetMap results found."
              : "No OpenStreetMap results shown yet."
          }
          label="Found via OpenStreetMap"
          loading={osmLoading}
          loadingText="Searching OpenStreetMap..."
          onSelect={onSelectOsm}
          results={osmResults}
          selected={selected}
        />
      )}
    </div>
  );
}

function ManualCommunityPanel({ disabled, draft, onDraftChange }) {
  return (
    <div className="grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-stone-200">
      <input
        className={inputClass}
        type="text"
        placeholder="Condo or residence name"
        value={draft.name}
        disabled={disabled}
        onChange={(event) => onDraftChange("name", event.target.value)}
      />
      <input
        className={inputClass}
        type="text"
        placeholder="City / town / suburb / district"
        value={draft.area}
        disabled={disabled}
        onChange={(event) => onDraftChange("area", event.target.value)}
      />
      <input
        className={inputClass}
        type="text"
        placeholder="State"
        value={draft.state}
        disabled={disabled}
        onChange={(event) => onDraftChange("state", event.target.value)}
      />
      <input
        className={inputClass}
        type="text"
        placeholder="Country, e.g. Malaysia"
        value={draft.country}
        disabled={disabled}
        onChange={(event) => onDraftChange("country", event.target.value)}
      />
      <select
        className={inputClass}
        value={draft.type}
        disabled={disabled}
        onChange={(event) => onDraftChange("type", event.target.value)}
      >
        {communityTypes.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
    </div>
  );
}

function ExistingCommunityResults({
  emptyText,
  loading,
  loadingText,
  onSelect,
  results,
  selected,
}) {
  return (
    <div className="grid gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black text-slate-900">
            Matching existing communities
          </p>
          <p className="text-xs font-semibold leading-5 text-slate-500">
            Pick one of these if it matches your home area.
          </p>
        </div>
        {results.length > 0 && (
          <span className="self-start rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
            {results.length} found
          </span>
        )}
      </div>

      {loading && (
        <p className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-500 ring-1 ring-emerald-100">
          {loadingText}
        </p>
      )}

      {!loading && results.length === 0 && (
        <p className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-500 ring-1 ring-emerald-100">
          {emptyText}
        </p>
      )}

      {!loading &&
        results.map((community) => (
          <CommunityResultButton
            community={community}
            key={community.communityId || community.externalId}
            label={getShareSyncResultLabel(community)}
            onSelect={onSelect}
            selected={selected}
          />
        ))}
    </div>
  );
}

function ResultSection({
  emptyText,
  label,
  loading,
  loadingText,
  onSelect,
  results,
  selected,
}) {
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black text-slate-800">
          {label === "ShareSync community"
            ? "ShareSync results"
            : "OpenStreetMap results"}
        </p>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-stone-200">
          {label}
        </span>
      </div>

      {loading && (
        <p className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-500 ring-1 ring-stone-200">
          {loadingText}
        </p>
      )}

      {!loading && results.length === 0 && (
        <p className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-500 ring-1 ring-stone-200">
          {emptyText}
        </p>
      )}

      {!loading &&
        results.map((community) => (
          <CommunityResultButton
            community={community}
            key={community.communityId || community.externalId}
            label={label}
            onSelect={onSelect}
            selected={selected}
          />
        ))}
    </div>
  );
}

function getShareSyncResultLabel(community) {
  if (community.source === "osm") {
    return "ShareSync community from OpenStreetMap";
  }

  if (community.source === "manual") {
    return "Manually created ShareSync community";
  }

  return "ShareSync community";
}

function SelectedCommunityPreview({ selected }) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
      <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
        Selected community
      </p>
      <p className="mt-1 font-black text-emerald-950">{selected.name}</p>
      <p className="mt-1 font-semibold text-emerald-800">
        {[selected.area, selected.state, selected.country, selected.type]
          .filter(Boolean)
          .join(" - ")}
      </p>
      {selected.source === "osm" && (
        <p className="mt-1 text-xs font-bold text-emerald-700">
          Found via OpenStreetMap
        </p>
      )}
    </div>
  );
}

function CommunityResultButton({ community, label, onSelect, selected }) {
  const isSelected =
    selected?.communityId === community.communityId ||
    selected?.externalId === community.externalId;

  return (
    <button
      className={isSelected ? selectedResultButtonClass : resultButtonClass}
      type="button"
      onClick={() => onSelect(community)}
    >
      <span className="block font-black text-slate-950">
        {community.name}
      </span>
      <span className="mt-1 block text-sm font-semibold text-slate-500">
        {[community.area, community.state, community.type]
          .filter(Boolean)
          .join(" - ")}
      </span>
      {community.displayName && community.displayName !== community.name && (
        <span className="mt-1 line-clamp-2 block text-xs font-semibold text-slate-500">
          {community.displayName}
        </span>
      )}
      <span className="mt-2 inline-flex rounded-full bg-stone-50 px-2 py-1 text-xs font-bold text-slate-600 ring-1 ring-stone-200">
        {label}
      </span>
    </button>
  );
}

export default CommunitySelector;
