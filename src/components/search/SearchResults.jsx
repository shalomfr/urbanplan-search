import React from "react";
import { motion } from "framer-motion";
import { FileText, AlertCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import PlanCard from "./PlanCard";

export default function SearchResults({ results, savedPlanIds, onSave, searchQuery }) {
  if (!results) return null;

  if (results.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-16"
        dir="rtl"
      >
        <AlertCircle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">לא נמצאו תוכניות</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          נסה לחפש עם מילות מפתח אחרות, או חפש ישירות במערכות הממשלתיות
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => window.open(`https://mavat.iplan.gov.il/SV3?searchEntity=1&searchType=0&entityType=0`, "_blank")}
          >
            <ExternalLink className="w-4 h-4" />
            חפש במבא״ת
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => window.open("https://apps.land.gov.il/TabaSearch/", "_blank")}
          >
            <ExternalLink className="w-4 h-4" />
            חפש ברמ״י
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">
            נמצאו {results.length} תוכניות
          </h2>
        </div>
        {searchQuery && (
          <span className="text-sm text-muted-foreground">
            עבור: <span className="font-medium text-foreground">{searchQuery}</span>
          </span>
        )}
      </div>

      <div className="space-y-3">
        {results.map((plan, index) => (
          <PlanCard
            key={plan.plan_number + index}
            plan={plan}
            index={index}
            onSave={onSave}
            isSaved={savedPlanIds.has(plan.plan_number)}
          />
        ))}
      </div>

      {/* Direct links */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 p-5 bg-muted/50 rounded-xl border border-border/50 text-center"
      >
        <p className="text-sm text-muted-foreground mb-3">
          רוצה לחפש ישירות במערכות הרשמיות?
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => window.open("https://mavat.iplan.gov.il/SV3", "_blank")}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            מידע תכנוני - מבא״ת
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => window.open("https://apps.land.gov.il/TabaSearch/", "_blank")}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            איתור תב״ע - רמ״י
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => window.open("https://ags.iplan.gov.il/xplan/", "_blank")}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            XPLAN
          </Button>
        </div>
      </motion.div>
    </div>
  );
}