import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

const inputClass =
  "w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";

function MyItems({ activeCommunity, user, userProfile }) {
  const [itemsState, setItemsState] = useState({
    community: "",
    ownerId: "",
    items: [],
  });
  const [editingItemId, setEditingItemId] = useState("");
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAvailable, setEditAvailable] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || !activeCommunity) {
      return undefined;
    }

    const myItemsQuery = query(
      collection(db, "items"),
      where("ownerId", "==", user.uid),
      where("community", "==", activeCommunity),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      myItemsQuery,
      (snapshot) => {
        const nextItems = snapshot.docs.map((itemDoc) => ({
          id: itemDoc.id,
          ...itemDoc.data(),
        }));

        setItemsState({
          community: activeCommunity,
          ownerId: user.uid,
          items: nextItems,
        });
      },
      (error) => {
        alert(error.message);
        setItemsState({
          community: activeCommunity,
          ownerId: user.uid,
          items: [],
        });
      }
    );

    return () => unsubscribe();
  }, [activeCommunity, user]);

  const startEditing = (item) => {
    setEditingItemId(item.id);
    setEditName(item.name);
    setEditDescription(item.description || "");
    setEditAvailable(item.available);
  };

  const cancelEditing = () => {
    setEditingItemId("");
    setEditName("");
    setEditDescription("");
    setEditAvailable(true);
  };

  const saveItem = async (event) => {
    event.preventDefault();

    if (!editName.trim()) {
      alert("Please enter an item name.");
      return;
    }

    setSaving(true);

    try {
      await updateDoc(doc(db, "items", editingItemId), {
        name: editName.trim(),
        description: editDescription.trim(),
        available: editAvailable,
      });

      cancelEditing();
    } catch (error) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (itemId) => {
    const confirmed = window.confirm("Delete this item?");

    if (!confirmed) {
      return;
    }

    try {
      await deleteDoc(doc(db, "items", itemId));
    } catch (error) {
      alert(error.message);
    }
  };

  const loading =
    activeCommunity &&
    user &&
    (itemsState.community !== activeCommunity || itemsState.ownerId !== user.uid);
  const items =
    itemsState.community === activeCommunity && itemsState.ownerId === user?.uid
      ? itemsState.items
      : [];
  const getOwnerLabel = (item) =>
    item.ownerUsername || userProfile?.username || item.ownerEmail || item.ownerId;

  return (
    <section className="grid gap-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Manage
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          My Items
        </h2>
        <p className="mt-2 text-slate-600">
          Your listed items in{" "}
          <span className="font-semibold text-emerald-800">
            {activeCommunity}
          </span>
        </p>
      </div>

      <div className="grid gap-4">
        {loading && (
          <p className="rounded-2xl border border-stone-200 bg-white p-6 text-slate-600 shadow-sm">
            Loading your items...
          </p>
        )}

        {!loading && items.length === 0 && (
          <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-6 text-slate-600">
            You have no items here yet.
          </p>
        )}

        {items.map((item) => (
          <article
            className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 shadow-sm"
            key={item.id}
          >
            {editingItemId === item.id ? (
              <form className="grid gap-4" onSubmit={saveItem}>
                <input
                  className={inputClass}
                  type="text"
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                />

                <textarea
                  className={inputClass}
                  value={editDescription}
                  onChange={(event) => setEditDescription(event.target.value)}
                />

                <label className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-stone-200">
                  <input
                    className="h-4 w-4 rounded border-stone-300 text-emerald-700 focus:ring-emerald-500"
                    type="checkbox"
                    checked={editAvailable}
                    onChange={(event) => setEditAvailable(event.target.checked)}
                  />
                  Available now
                </label>

                <div className="flex flex-wrap gap-3">
                  <button
                    className="rounded-xl bg-emerald-700 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                    type="submit"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    className="rounded-xl border border-stone-200 bg-white px-4 py-2 font-semibold text-slate-700 transition hover:bg-stone-50"
                    type="button"
                    onClick={cancelEditing}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <h3 className="text-xl font-bold text-slate-900">
                    {item.name}
                  </h3>
                  <p className="mt-2 text-slate-600">
                    {item.description || "No description provided."}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-sm">
                    <span className="rounded-full bg-white px-3 py-1 font-medium text-slate-600 ring-1 ring-stone-200">
                      {item.community}
                    </span>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-800">
                      Owner: {getOwnerLabel(item)}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-3 md:items-end">
                  <strong
                    className={
                      item.available
                        ? "inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-800 ring-1 ring-emerald-200"
                        : "inline-flex rounded-full bg-stone-100 px-3 py-1 text-sm font-bold text-slate-500 ring-1 ring-stone-200"
                    }
                  >
                    {item.available ? "Available" : "Unavailable"}
                  </strong>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="rounded-xl border border-stone-200 bg-white px-4 py-2 font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50"
                      type="button"
                      onClick={() => startEditing(item)}
                    >
                      Edit
                    </button>
                    <button
                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 font-semibold text-red-700 transition hover:bg-red-100"
                      type="button"
                      onClick={() => deleteItem(item.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

export default MyItems;
