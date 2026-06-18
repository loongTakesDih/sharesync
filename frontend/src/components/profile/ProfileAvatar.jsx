function ProfileAvatar({ className = "", profile, size = "lg" }) {
  const imageSrc = profile?.profileImageBase64 || profile?.photoURL || "";
  const initial = (profile?.username || "U").slice(0, 1).toUpperCase();
  const sizeClass =
    size === "sm"
      ? "h-9 w-9 rounded-xl text-sm"
      : size === "md"
        ? "h-16 w-16 rounded-2xl text-2xl"
        : "h-24 w-24 rounded-3xl text-4xl";

  if (imageSrc) {
    return (
      <img
        alt=""
        className={`${sizeClass} object-cover ring-4 ring-white ${className}`}
        src={imageSrc}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} flex items-center justify-center bg-gradient-to-br from-emerald-700 to-teal-700 font-black text-white ring-4 ring-white ${className}`}
    >
      {initial}
    </div>
  );
}

export default ProfileAvatar;
