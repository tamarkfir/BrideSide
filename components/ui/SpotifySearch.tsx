"use client";

import { useState, useEffect, useRef } from "react";
import AutoTextarea from "./AutoTextarea";

type TrackResult = {
  id: string;
  name: string;
  artist: string;
  image?: string;
};

type Props = {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
};

export default function SpotifySearch({ value, onChange, placeholder, className = "" }: Props) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<TrackResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse if it's already a Spotify track
  const isSpotifyTrack = value.startsWith("spotify:track:");
  const displayValue = isSpotifyTrack ? value.split("|")[1] || "שיר מספוטיפיי" : value;

  // Sync external value changes (if not actively editing)
  useEffect(() => {
    if (!showDropdown) {
      setQuery(displayValue);
    }
  }, [value, displayValue, showDropdown]);

  // Debounce search
  useEffect(() => {
    if (!showDropdown || query.trim().length < 2 || isSpotifyTrack) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, showDropdown, isSpotifyTrack]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        // If they just typed free text without selecting Spotify, save it
        if (query !== displayValue) {
          onChange(query);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [query, displayValue, onChange]);

  function handleSelectTrack(track: TrackResult) {
    // Format: spotify:track:ID|Name - Artist
    const formatted = `spotify:track:${track.id}|${track.name} - ${track.artist}`;
    onChange(formatted);
    setQuery(`${track.name} - ${track.artist}`);
    setShowDropdown(false);
  }

  function handleClear() {
    onChange("");
    setQuery("");
    setShowDropdown(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      {isSpotifyTrack ? (
        <div className={`flex items-center justify-between gap-3 ${className}`}>
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" width="20" height="20" className="text-[#1DB954]">
              <path fill="currentColor" d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.48.659.24 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.56.3z"/>
            </svg>
            <span className="text-brand-ink font-medium">{displayValue}</span>
          </div>
          <button 
            type="button" 
            onClick={handleClear}
            className="text-brand-sand hover:text-brand-roseDark text-sm px-2"
          >
            ✕ הסרה
          </button>
        </div>
      ) : (
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
            onChange(e.target.value); // Sync raw text immediately so they don't lose it
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder}
          className={className}
        />
      )}

      {showDropdown && !isSpotifyTrack && query.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-xl bg-white shadow-lg border border-brand-sand/20 py-2">
          {isSearching ? (
            <div className="p-4 text-center text-sm text-brand-sand">מחפשת ב-Spotify...</div>
          ) : results.length > 0 ? (
            <ul className="flex flex-col">
              {results.map((track) => (
                <li key={track.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectTrack(track)}
                    className="flex w-full items-center gap-3 px-4 py-2 hover:bg-brand-rose/5 text-right transition"
                  >
                    {track.image && (
                      <img src={track.image} alt="" className="h-10 w-10 rounded object-cover shadow-sm" />
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-brand-ink">{track.name}</span>
                      <span className="text-xs text-brand-sand">{track.artist}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-sm text-brand-sand">
              לא מצאנו שיר כזה ב-Spotify. אפשר להשאיר את זה כטקסט חופשי.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
