import React from "react";

interface Props {
  displayName: string;
  username: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  location?: string;
  website?: string;
  joinedAt: string;
  followingCount: number;
  followersCount: number;
  isOwner?: boolean;
  onEditProfile?: () => void;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
}

export default function ProfileHeader({
  displayName,
  username,
  bio,
  avatarUrl,
  bannerUrl,
  location,
  website,
  joinedAt,
  followingCount,
  followersCount,
  isOwner = false,
  onEditProfile,
  onFollowersClick,
  onFollowingClick,
}: Props) {
  const websiteUrl = website
    ? website.startsWith("http")
      ? website
      : `https://${website}`
    : "";

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Banner */}
      <div
        className="h-32 w-full"
        style={{
          background: bannerUrl
            ? `url(${bannerUrl}) center/cover`
            : "linear-gradient(135deg, #60a5fa 0%, #a855f7 60%, #7c3aed 100%)",
        }}
      />

      {/* Body */}
      <div className="px-5">
        {/* Avatar row */}
        <div className="flex items-end justify-between -mt-11 mb-3">
          <div className="w-[88px] h-[88px] rounded-full border-4 border-white overflow-hidden bg-gray-100 flex-shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-medium text-gray-400">
                {displayName?.[0]?.toUpperCase() || "U"}
              </div>
            )}
          </div>

          {isOwner ? (
            <button
              onClick={onEditProfile}
              className="h-[34px] px-4 rounded-lg border border-gray-200 text-[13px] font-medium hover:bg-gray-50 transition-colors"
            >
              Edit Profile
            </button>
          ) : (
            <button className="h-[34px] px-4 rounded-lg bg-blue-600 text-white text-[13px] font-medium hover:bg-blue-700 transition-colors">
              Follow
            </button>
          )}
        </div>

        {/* Info */}
        <h1 className="text-xl font-semibold text-gray-900">
          {displayName}
        </h1>
        <p className="text-[14px] text-gray-500 mt-0.5">
          @{username}
        </p>

        {bio && (
          <p className="text-[14px] text-gray-800 mt-2 leading-relaxed">
            {bio}
          </p>
        )}

        {/* Meta */}
        <div className="flex flex-wrap gap-3 mt-2.5 mb-3.5">
          {location && (
            <span className="flex items-center gap-1.5 text-[13px] text-gray-500">
              <LocationIcon /> {location}
            </span>
          )}

          {website && (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-[13px] text-blue-600 hover:underline"
            >
              <LinkIcon /> {website}
            </a>
          )}

          <span className="flex items-center gap-1.5 text-[13px] text-gray-500">
            <CalendarIcon /> Joined {joinedAt}
          </span>
        </div>

        {/* Stats */}
        <div className="flex gap-5 pb-4 border-b border-gray-100">
          <button
            onClick={onFollowingClick || (() => {})}
            className="flex gap-1 text-[14px] hover:underline"
          >
            <span className="font-medium text-gray-900">
              {followingCount}
            </span>
            <span className="text-gray-500">Following</span>
          </button>

          <button
            onClick={onFollowersClick || (() => {})}
            className="flex gap-1 text-[14px] hover:underline"
          >
            <span className="font-medium text-gray-900">
              {followersCount}
            </span>
            <span className="text-gray-500">Followers</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* Icons */

function LocationIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}