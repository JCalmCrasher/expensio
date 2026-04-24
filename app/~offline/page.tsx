"use client";

import { useRouter } from "next/navigation";

export default function OfflinePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/15">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-8 w-8 text-green-400"
        >
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
      </div>

      <h1 className="text-xl font-bold text-white">You&apos;re offline</h1>
      <p className="mt-2 text-sm text-zinc-500 max-w-xs">
        Connect to the internet to load the app for the first time.
        Once loaded, it works fully offline.
      </p>

      <button
        onClick={() => router.push("/app")}
        className="mt-8 rounded-xl bg-green-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-500"
      >
        Try again
      </button>
    </div>
  );
}
