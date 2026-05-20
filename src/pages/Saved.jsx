import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { Bookmark } from "lucide-react";
import SavedPlansList from "../components/saved/SavedPlansList";

export default function Saved() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: savedPlans = [], isLoading } = useQuery({
    queryKey: ["savedPlans"],
    queryFn: () => base44.entities.SavedPlan.list("-created_date"),
  });

  const handleDelete = async (id) => {
    await base44.entities.SavedPlan.delete(id);
    queryClient.invalidateQueries({ queryKey: ["savedPlans"] });
    toast({ title: "התוכנית הוסרה מהשמורים" });
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="bg-card border-b">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Bookmark className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">תוכניות שמורות</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {savedPlans.length} תוכניות שמורות
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <SavedPlansList plans={savedPlans} onDelete={handleDelete} />
        )}
      </div>
    </div>
  );
}