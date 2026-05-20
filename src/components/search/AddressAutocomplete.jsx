import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Hash, Building2 } from "lucide-react";
import { geocodeAutocomplete } from "@/api/geocode";

const TYPE_LABELS = {
  address: { label: "כתובת", icon: MapPin, color: "bg-blue-100 text-blue-800 border-blue-200" },
  parcel:  { label: "גוש/חלקה", icon: Hash, color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  street:  { label: "רחוב", icon: Building2, color: "bg-amber-100 text-amber-800 border-amber-200" },
};

export default function AddressAutocomplete({ value, onChange, onSelect, placeholder, autoFocus }) {
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const abortRef = useRef(null);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value || value.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      try {
        const results = await geocodeAutocomplete(value, controller.signal);
        // Cap to top 8 results
        setSuggestions(results.slice(0, 8));
        setIsOpen(true);
        setActiveIndex(-1);
      } catch (err) {
        if (err.name !== "AbortError") {
          setSuggestions([]);
        }
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handlePick(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handlePick = (suggestion) => {
    onChange(suggestion.text);
    setIsOpen(false);
    onSelect(suggestion);
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => value.length >= 2 && setIsOpen(true)}
        placeholder={placeholder}
        className="h-14 text-base px-5 rounded-xl"
        autoFocus={autoFocus}
        autoComplete="off"
      />
      {loading && (
        <Loader2 className="absolute top-1/2 left-4 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
      )}

      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full mt-1 right-0 left-0 z-50 bg-popover border rounded-xl shadow-lg overflow-hidden max-h-96 overflow-y-auto">
          {suggestions.map((s, idx) => {
            const meta = TYPE_LABELS[s.type] || { label: s.type, icon: MapPin, color: "bg-muted text-muted-foreground" };
            const Icon = meta.icon;
            const isActive = idx === activeIndex;
            return (
              <button
                key={s.id || idx}
                type="button"
                className={`w-full text-right p-3 flex items-start gap-3 hover:bg-accent transition-colors ${isActive ? "bg-accent" : ""}`}
                onClick={() => handlePick(s)}
                onMouseEnter={() => setActiveIndex(idx)}
              >
                <Icon className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{s.text}</div>
                  {s.originalText && s.originalText !== s.text && (
                    <div className="text-xs text-muted-foreground truncate">{s.originalText}</div>
                  )}
                </div>
                <Badge variant="outline" className={`text-xs flex-shrink-0 ${meta.color}`}>
                  {meta.label}
                </Badge>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
