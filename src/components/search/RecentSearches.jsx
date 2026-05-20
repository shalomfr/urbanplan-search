import React from "react";
import { motion } from "framer-motion";
import { Clock, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RecentSearches({ searches, onSelect, onClear }) {
  if (!searches || searches.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-3xl mx-auto px-4 mt-6"
      dir="rtl"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>חיפושים אחרונים</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground hover:text-destructive gap-1.5 h-7"
          onClick={onClear}
        >
          <Trash2 className="w-3 h-3" />
          נקה
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {searches.slice(0, 8).map((search) => (
          <button
            key={search.id}
            onClick={() => onSelect(search.query)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border/60 text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all"
          >
            <Search className="w-3 h-3" />
            {search.query}
          </button>
        ))}
      </div>
    </motion.div>
  );
}