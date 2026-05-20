import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  MapPin,
  Trash2,
  ExternalLink,
  BookmarkX,
} from "lucide-react";

export default function SavedPlansList({ plans, onDelete }) {
  if (!plans || plans.length === 0) {
    return (
      <div className="text-center py-20" dir="rtl">
        <BookmarkX className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">אין תוכניות שמורות</h3>
        <p className="text-muted-foreground text-sm">
          שמור תוכניות מתוצאות החיפוש כדי למצוא אותן בקלות
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3" dir="rtl">
      <AnimatePresence>
        {plans.map((plan) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <Card className="border-border/60 hover:shadow-md transition-all">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="font-bold text-primary">{plan.plan_number}</span>
                      {plan.status && (
                        <Badge variant="secondary" className="text-xs">{plan.status}</Badge>
                      )}
                    </div>
                    {plan.plan_name && (
                      <p className="font-medium text-foreground mb-1">{plan.plan_name}</p>
                    )}
                    {plan.location && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {plan.location}
                      </p>
                    )}
                    {plan.notes && (
                      <p className="text-sm text-muted-foreground mt-1 italic">{plan.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        const url = `https://mavat.iplan.gov.il/SV4/1/${encodeURIComponent(plan.plan_number)}`;
                        window.open(url, "_blank");
                      }}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                      onClick={() => onDelete(plan.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}