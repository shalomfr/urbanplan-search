import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  MapPin,
  Calendar,
  Building2,
  ExternalLink,
  Bookmark,
  Check,
} from "lucide-react";

const statusColors = {
  "מאושרת": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "מופקדת": "bg-amber-100 text-amber-800 border-amber-200",
  "בתהליך": "bg-blue-100 text-blue-800 border-blue-200",
  "הופקדה": "bg-amber-100 text-amber-800 border-amber-200",
  "אושרה": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "default": "bg-muted text-muted-foreground border-border",
};

function getStatusClass(status) {
  if (!status) return statusColors.default;
  for (const [key, cls] of Object.entries(statusColors)) {
    if (status.includes(key)) return cls;
  }
  return statusColors.default;
}

export default function PlanCard({ plan, index, onSave, isSaved }) {
  const mavatUrl = plan.plan_number
    ? `https://mavat.iplan.gov.il/SV4/1/${encodeURIComponent(plan.plan_number)}`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="group hover:shadow-lg transition-all duration-300 border-border/60 hover:border-primary/30 overflow-hidden">
        <CardContent className="p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Plan number and status */}
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <div className="flex items-center gap-2 text-primary font-bold text-lg">
                  <FileText className="w-4.5 h-4.5 flex-shrink-0" />
                  <span className="truncate">{plan.plan_number || "ללא מספר"}</span>
                </div>
                {plan.status && (
                  <Badge variant="outline" className={`text-xs font-medium ${getStatusClass(plan.status)}`}>
                    {plan.status}
                  </Badge>
                )}
              </div>

              {/* Plan name */}
              {plan.plan_name && (
                <h3 className="font-semibold text-foreground mb-3 leading-relaxed">
                  {plan.plan_name}
                </h3>
              )}

              {/* Info pills */}
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                {plan.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary/60" />
                    <span>{plan.location}</span>
                  </div>
                )}
                {plan.authority && (
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-primary/60" />
                    <span>{plan.authority}</span>
                  </div>
                )}
                {plan.approval_date && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary/60" />
                    <span>{plan.approval_date}</span>
                  </div>
                )}
              </div>

              {/* Gush/Helka */}
              {(plan.gush || plan.helka) && (
                <div className="mt-2 text-sm text-muted-foreground">
                  {plan.gush && <span>גוש: {plan.gush}</span>}
                  {plan.gush && plan.helka && <span className="mx-2">|</span>}
                  {plan.helka && <span>חלקה: {plan.helka}</span>}
                </div>
              )}

              {plan.plan_type && (
                <div className="mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {plan.plan_type}
                  </Badge>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 flex-shrink-0">
              <Button
                variant={isSaved ? "secondary" : "outline"}
                size="icon"
                className="h-9 w-9"
                onClick={() => onSave(plan)}
                title={isSaved ? "נשמר" : "שמור"}
              >
                {isSaved ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Bookmark className="w-4 h-4" />
                )}
              </Button>
              {mavatUrl && (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => window.open(mavatUrl, "_blank")}
                  title="צפה במבא״ת"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}