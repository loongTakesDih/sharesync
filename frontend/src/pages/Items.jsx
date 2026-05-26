import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

const inputClass =
  "w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";

function Items({ activeCommunity, user, userProfile }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [itemsState, setItemsState] = useState({
    community: "",
    items: [],
  });
  const [saving, setSaving] = useState(false);
  const [requestingItemId, setRequestingItemId] = useState("");
  const [requestsState, setRequestsState] = useState({
    community: "",
    userId: "",
    requestedItemIds: [],
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user || !activeCommunity) {
      return undefined;
    }

    const itemsQuery = query(
      collection(db, "items"),
      where("community", "==", activeCommunity),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      itemsQuery,
      (snapshot) => {
        const nextItems = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setItemsState({
          community: activeCommunity,
          items: nextItems,
        });
      },
      (error) => {
        alert(error.message);
        setItemsState({
          community: activeCommunity,
          items: [],
        });
      }
    );

    return () => unsubscribe();
  }, [activeCommunity, user]);

  useEffect(() => {
    if (!user || !activeCommunity) {
      return undefined;
    }

    const requestsQuery = query(
      collection(db, "requests"),
      where("borrowerId", "==", user.uid),
      where("community", "==", activeCommunity),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      requestsQuery,
      (snapshot) => {
        const nextRequestedItemIds = snapshot.docs
          .map((requestDoc) => requestDoc.data())
          .filter((request) => request.status === "pending")
          .map((request) => request.itemId);

        setRequestsState({
          community: activeCommunity,
          userId: user.uid,
          requestedItemIds: nextRequestedItemIds,
        });
      },
      (error) => {
        alert(error.message);
        setRequestsState({
          community: activeCommunity,
          userId: user.uid,
          requestedItemIds: [],
        });
      }
    );

    return () => unsubscribe();
  }, [activeCommunity, user]);

  const addItem = async (event) => {
    event.preventDefault();

    if (!name.trim()) {
      alert("Please enter an item name.");
      return;
    }

    if (!activeCommunity) {
      alert("Please select a community first.");
      return;
    }

    if (!userProfile?.username) {
      alert("Please complete your profile before adding items.");
      return;
    }

    setSaving(true);

    try {
      await addDoc(collection(db, "items"), {
        name: name.trim(),
        description: description.trim(),
        ownerId: user.uid,
        ownerUsername: userProfile.username,
        ownerEmail: user.email,
        community: activeCommunity,
        available: true,
        createdAt: serverTimestamp(),
      });

      setName("");
      setDescription("");
    } catch (error) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  const requestItem = async (item) => {
    if (item.ownerId === user.uid) {
      alert("You cannot request your own item.");
      return;
    }

    if (!item.available) {
      alert("This item is currently unavailable.");
      return;
    }

    if (!activeCommunity) {
      alert("Please select a community first.");
      return;
    }

    if (!userProfile?.username) {
      setMessage("Please complete your profile before requesting items.");
      return;
    }

    if (requestedItemIds.includes(item.id)) {
      setMessage("You have already requested this item.");
      return;
    }

    setRequestingItemId(item.id);
    setMessage("");

    try {
      const itemSnapshot = await getDoc(doc(db, "items", item.id));

      if (!itemSnapshot.exists()) {
        setMessage("This item no longer exists.");
        return;
      }

      const freshItem = {
        id: itemSnapshot.id,
        ...itemSnapshot.data(),
      };

      if (freshItem.ownerId === user.uid) {
        setMessage("You cannot request your own item.");
        return;
      }

      if (freshItem.community !== activeCommunity || !freshItem.available) {
        setMessage("This item is no longer available.");
        return;
      }

      const duplicateRequestQuery = query(
        collection(db, "requests"),
        where("borrowerId", "==", user.uid),
        where("community", "==", activeCommunity),
        where("itemId", "==", freshItem.id),
        where("status", "==", "pending"),
        limit(1)
      );
      const duplicateRequest = await getDocs(duplicateRequestQuery);

      if (!duplicateRequest.empty) {
        markItemRequested(freshItem.id);
        setMessage("You have already requested this item.");
        return;
      }

      await addDoc(collection(db, "requests"), {
        itemId: freshItem.id,
        itemName: freshItem.name,
        ownerId: freshItem.ownerId,
        ownerUsername: freshItem.ownerUsername || "",
        ownerEmail: freshItem.ownerEmail || "",
        borrowerId: user.uid,
        borrowerUsername: userProfile.username,
        borrowerEmail: user.email,
        community: activeCommunity,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      markItemRequested(freshItem.id);
      setMessage("Request sent.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setRequestingItemId("");
    }
  };

  const loading = activeCommunity && itemsState.community !== activeCommunity;
  const items = itemsState.community === activeCommunity ? itemsState.items : [];
  const requestedItemIds =
    requestsState.community === activeCommunity && requestsState.userId === user?.uid
      ? requestsState.requestedItemIds
      : [];

  const markItemRequested = (itemId) => {
    setRequestsState((currentState) => {
      if (currentState.requestedItemIds.includes(itemId)) {
        return currentState;
      }

      if (
        currentState.community !== activeCommunity ||
        currentState.userId !== user.uid
      ) {
        return {
          community: activeCommunity,
          userId: user.uid,
          requestedItemIds: [itemId],
        };
      }

      return {
        ...currentState,
        requestedItemIds: [...currentState.requestedItemIds, itemId],
      };
    });
  };

  return (
    <section className="grid gap-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Marketplace
        </p>
        <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Items
            </h2>
            <p className="mt-2 text-slate-600">
              Showing items in{" "}
              <span className="font-semibold text-emerald-800">
                {activeCommunity}
              </span>
            </p>
          </div>
        </div>

        {message && (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {message}
          </p>
        )}

        <form className="mt-6 grid gap-4 md:max-w-2xl" onSubmit={addItem}>
        <input
          className={inputClass}
          type="text"
          placeholder="Item name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />

        <textarea
          className={inputClass}
          placeholder="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />

        <button
          className="rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={saving}
        >
          {saving ? "Adding..." : "Add Item"}
        </button>
      </form>
      </div>

      <div className="grid gap-4">
        {loading && (
          <p className="rounded-2xl border border-stone-200 bg-white p-6 text-slate-600 shadow-sm">
            Loading items...
          </p>
        )}

        {!loading && items.length === 0 && (
          <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-6 text-slate-600">
            No items listed yet. Add the first useful thing for your community.
          </p>
        )}

        {items.map((item) => (
          <ItemCard
            item={item}
            key={item.id}
            onRequest={requestItem}
            requested={requestedItemIds.includes(item.id)}
            requesting={requestingItemId === item.id}
            user={user}
          />
        ))}
      </div>
    </section>
  );
}

function ItemCard({ item, onRequest, requested, requesting, user }) {
  const isOwnItem = item.ownerId === user.uid;
  const ownerLabel = item.ownerUsername || item.ownerEmail || item.ownerId;
  const requestDisabled = !item.available || requested || requesting;
  let requestLabel = "Request";

  if (requested) {
    requestLabel = "Requested";
  } else if (requesting) {
    requestLabel = "Requesting...";
  }

  return (
    <article className="flex flex-col gap-5 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        <h3 className="text-xl font-bold text-slate-900">
          {item.name}
          {isOwnItem ? " (Yours)" : ""}
        </h3>
        <p className="mt-2 text-slate-600">
          {item.description || "No description provided."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-stone-100 px-3 py-1 font-medium text-slate-600">
            {item.community}
          </span>
          <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-800">
            Owner: {ownerLabel}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-3 md:items-end">
        <strong
          className={
            item.available
              ? "inline-flex rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-800 ring-1 ring-emerald-200"
              : "inline-flex rounded-full bg-stone-100 px-3 py-1 text-sm font-bold text-slate-500 ring-1 ring-stone-200"
          }
        >
          {item.available ? "Available" : "Unavailable"}
        </strong>

        {!isOwnItem && (
          <button
            className="rounded-xl bg-emerald-700 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-slate-500"
            type="button"
            disabled={requestDisabled}
            onClick={() => onRequest(item)}
          >
            {requestLabel}
          </button>
        )}
      </div>
    </article>
  );
}

export default Items;
