import { useEffect, useState } from "react";
import CommunityLocationPicker from "./CommunityLocationPicker";
import {
  communityTypes,
  findDuplicateCommunity,
  getCommunityLabel,
  searchActiveCommunities,
  toCommunitySummary,
} from "../../services/communityService";
import { inputClass } from "../../utils/styles";

const initialDraft = {
  name: "",
  area: "",
  state: "",
  country: "Malaysia",
  type: "Condominium",
  location: null,
};

function CommunitySelector({ disabled = false, onChange, selectedCommunity }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState(initialDraft);
  const [locationMessage, setLocationMessage] = useState("");
  const selected = toCommunitySummary(selectedCommunity);

  useEffect(() => {
    let active = true;

    searchActiveCommunities(searchTerm)
      .then((results) => {
        if (active) {
          setCommunities(results);
        }
      })
      .catch((error) => {
        if (active) {
          setMessage(error.message);
          setCommunities([]);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [searchTerm]);

  const selectCommunity = (community) => {
    onChange(toCommunitySummary(community));
    setMessage("");
  };

  const updateDraft = (field, value) => {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateDraftLocation = (location) => {
    setDraft((current) => ({
      ...current,
      location,
    }));
    setLocationMessage("");
  };

  const createDraftCommunity = async () => {
    setMessage("");

    if (
      !draft.name.trim() ||
      !draft.area.trim() ||
      !draft.state.trim() ||
      !draft.country.trim() ||
      !draft.type.trim()
    ) {
      setMessage("Please fill in all community fields.");
      return;
    }

    try {
      const duplicate = await findDuplicateCommunity(draft.name);

      if (duplicate) {
        selectCommunity(duplicate.community);
        setMessage(
          duplicate.exact
            ? `A community named ${duplicate.community.name} already exists, so it has been selected.`
            : `A similar community exists: ${getCommunityLabel(
                duplicate.community
              )}. It has been selected for you.`
        );
        return;
      }

      selectCommunity({
        ...draft,
        communityId: "",
        isNew: true,
      });
      setShowCreate(false);
      setMessage(
        "New community ready. It will be created when your profile is saved."
      );
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="grid gap-4">
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Community
        <input
          className={inputClass}
          type="search"
          placeholder="Search your community"
          value={searchTerm}
          disabled={disabled}
          onChange={(event) => {
            setLoading(true);
            setSearchTerm(event.target.value);
          }}
        />
      </label>

      <div className="grid gap-2 rounded-2xl border border-stone-200 bg-stone-50 p-3">
        {loading && (
          <p className="px-2 py-2 text-sm font-semibold text-slate-500">
            Loading communities...
          </p>
        )}

        {!loading && communities.length === 0 && (
          <p className="px-2 py-2 text-sm font-semibold text-slate-500">
            No active communities found.
          </p>
        )}

        {!loading &&
          communities.map((community) => (
            <button
              className={
                selected?.communityId === community.communityId
                  ? "rounded-xl border border-emerald-500 bg-white px-4 py-3 text-left shadow-sm"
                  : "rounded-xl border border-transparent bg-white px-4 py-3 text-left shadow-sm transition hover:border-emerald-200"
              }
              key={community.communityId}
              type="button"
              disabled={disabled}
              onClick={() => selectCommunity(community)}
            >
              <span className="block font-black text-slate-950">
                {community.name}
              </span>
              <span className="mt-1 block text-sm font-semibold text-slate-500">
                {[community.area, community.state, community.type]
                  .filter(Boolean)
                  .join(" - ")}
              </span>
              {community.location && (
                <span className="mt-1 block text-xs font-bold text-emerald-700">
                  Location pinned
                </span>
              )}
            </button>
          ))}
      </div>

      {selected?.name && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
          <p className="font-black text-emerald-950">{selected.name}</p>
          <p className="mt-1 font-semibold text-emerald-800">
            {[selected.area, selected.state, selected.country, selected.type]
              .filter(Boolean)
              .join(" - ")}
          </p>
          {selected.location && (
            <p className="mt-1 text-xs font-bold text-emerald-700">
              Location pinned: {selected.location.lat.toFixed(5)},{" "}
              {selected.location.lng.toFixed(5)}
            </p>
          )}
        </div>
      )}

      {message && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          {message}
        </p>
      )}

      <button
        className="justify-self-start rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50"
        type="button"
        disabled={disabled}
        onClick={() => setShowCreate((open) => !open)}
      >
        {showCreate ? "Hide new community" : "Create new community"}
      </button>

      {showCreate && (
        <div className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-4">
          <input
            className={inputClass}
            type="text"
            placeholder="Community name"
            value={draft.name}
            disabled={disabled}
            onChange={(event) => updateDraft("name", event.target.value)}
          />
          <input
            className={inputClass}
            type="text"
            placeholder="Area"
            value={draft.area}
            disabled={disabled}
            onChange={(event) => updateDraft("area", event.target.value)}
          />
          <input
            className={inputClass}
            type="text"
            placeholder="State"
            value={draft.state}
            disabled={disabled}
            onChange={(event) => updateDraft("state", event.target.value)}
          />
          <input
            className={inputClass}
            type="text"
            placeholder="Country"
            value={draft.country}
            disabled={disabled}
            onChange={(event) => updateDraft("country", event.target.value)}
          />
          <select
            className={inputClass}
            value={draft.type}
            disabled={disabled}
            onChange={(event) => updateDraft("type", event.target.value)}
          >
            {communityTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <CommunityLocationPicker
            disabled={disabled}
            location={draft.location}
            onChange={updateDraftLocation}
            onMessage={setLocationMessage}
          />
          {locationMessage && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
              {locationMessage}
            </p>
          )}
          <button
            className="rounded-xl bg-emerald-700 px-4 py-3 font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            disabled={disabled}
            onClick={createDraftCommunity}
          >
            Use this community
          </button>
        </div>
      )}
    </div>
  );
}

export default CommunitySelector;
