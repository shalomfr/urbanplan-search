import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { appParams } from "@/lib/app-params";
import { fetchAllPlanningInfo } from "@/api/jerusalemGis";
import { resolveTextToGushHelka } from "@/api/geocode";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";

const BASE44_ENABLED = !!appParams.appId;
import SearchHero from "../components/search/SearchHero";
import SearchForm from "../components/search/SearchForm";
import SearchResults from "../components/search/SearchResults";
import JerusalemGisResults from "../components/search/JerusalemGisResults";
import RecentSearches from "../components/search/RecentSearches";

export default function Search() {
  const [results, setResults] = useState(null);
  const [gisResults, setGisResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: savedPlans = [] } = useQuery({
    queryKey: ["savedPlans"],
    queryFn: () => base44.entities.SavedPlan.list("-created_date"),
    enabled: BASE44_ENABLED,
  });

  const { data: searchHistory = [] } = useQuery({
    queryKey: ["searchHistory"],
    queryFn: () => base44.entities.SearchHistory.list("-created_date", 10),
    enabled: BASE44_ENABLED,
  });

  const savedPlanIds = new Set(savedPlans.map((p) => p.plan_number));

  const handleSearch = async (query, searchType) => {
    setIsSearching(true);
    setResults(null);
    setGisResults(null);

    // Direct Jerusalem GIS path — query is { gush, helka }
    if (searchType === "jerusalem_direct") {
      const label = `ירושלים: גוש ${query.gush} / חלקה ${query.helka}`;
      setSearchQuery(label);
      try {
        const data = await fetchAllPlanningInfo(query);
        setGisResults({ data, query });
        if (BASE44_ENABLED) {
          try {
            await base44.entities.SearchHistory.create({
              query: label,
              search_type: "jerusalem_direct",
              results_count: data.categories.reduce((s, c) => s + (c.records?.length || 0), 0),
            });
            queryClient.invalidateQueries({ queryKey: ["searchHistory"] });
          } catch { /* history is optional */ }
        }
      } catch (err) {
        toast({
          title: "שגיאה בשליפה ממערכת ירושלים",
          description: err.message || "נסה שוב",
          variant: "destructive",
        });
        setGisResults({ data: null, query });
      } finally {
        setIsSearching(false);
      }
      return;
    }

    setSearchQuery(query);

    // Try to resolve "address" / "free_text" / "gush_helka" queries to gush+helka
    // via GovMap before falling back to LLM. Works without base44 entirely.
    if (searchType !== "plan_number") {
      try {
        const resolved = await resolveTextToGushHelka(query);
        if (resolved) {
          const label = `${query} (גוש ${resolved.gush} / חלקה ${resolved.helka})`;
          setSearchQuery(label);
          const data = await fetchAllPlanningInfo(resolved);
          setGisResults({ data, query: resolved });
          if (BASE44_ENABLED) {
            try {
              await base44.entities.SearchHistory.create({
                query: label,
                search_type: searchType,
                results_count: data.categories.reduce((s, c) => s + (c.records?.length || 0), 0),
              });
              queryClient.invalidateQueries({ queryKey: ["searchHistory"] });
            } catch { /* history is optional */ }
          }
          setIsSearching(false);
          return;
        }
      } catch { /* fall through to LLM */ }
    }

    const prompt = `אתה מומחה לתכנון ובנייה בישראל. המשתמש מחפש תוכניות בניין עיר (תב"ע) לפי השאילתה: "${query}"

חפש באינטרנט מידע על תוכניות תב"ע שקשורות לשאילתה הזו. חפש באתרים כמו mavat.iplan.gov.il, apps.land.gov.il/TabaSearch, govmap.gov.il, ומקורות נוספים.

החזר את כל התוכניות שמצאת. עבור כל תוכנית, ספק כמה שיותר פרטים:
- מספר התוכנית (plan_number)
- שם התוכנית (plan_name) 
- סטטוס (status) - למשל: מאושרת, מופקדת, בתהליך וכו'
- מיקום/כתובת (location)
- גוש (gush)
- חלקה (helka)
- סמכות מתכננת (authority)
- סוג התוכנית (plan_type)
- תאריך אישור (approval_date)

חשוב: החזר רק תוכניות אמיתיות שמצאת ברשת, אל תמציא תוכניות.`;

    const schema = {
      type: "object",
      properties: {
        plans: {
          type: "array",
          items: {
            type: "object",
            properties: {
              plan_number: { type: "string" },
              plan_name: { type: "string" },
              status: { type: "string" },
              location: { type: "string" },
              gush: { type: "string" },
              helka: { type: "string" },
              authority: { type: "string" },
              plan_type: { type: "string" },
              approval_date: { type: "string" },
            },
          },
        },
      },
    };

    if (!BASE44_ENABLED) {
      toast({
        title: "חיפוש חופשי לא זמין",
        description: "במצב עצמאי זמין רק חיפוש לפי גוש/חלקה/כתובת בירושלים.",
        variant: "destructive",
      });
      setResults([]);
      setIsSearching(false);
      return;
    }

    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: schema,
        model: "gemini_3_flash",
      });

      const plans = res?.plans || [];
      setResults(plans);

      try {
        await base44.entities.SearchHistory.create({
          query,
          search_type: searchType,
          results_count: plans.length,
        });
        queryClient.invalidateQueries({ queryKey: ["searchHistory"] });
      } catch { /* history is optional */ }
    } catch (err) {
      toast({
        title: "שגיאה בחיפוש",
        description: "אירעה שגיאה בחיפוש. נסה שוב.",
        variant: "destructive",
      });
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSavePlan = async (plan) => {
    if (!BASE44_ENABLED) {
      toast({
        title: "שמירה לא זמינה",
        description: "במצב עצמאי לא ניתן לשמור תוכניות.",
        variant: "destructive",
      });
      return;
    }
    if (savedPlanIds.has(plan.plan_number)) {
      const existing = savedPlans.find((p) => p.plan_number === plan.plan_number);
      if (existing) {
        await base44.entities.SavedPlan.delete(existing.id);
        queryClient.invalidateQueries({ queryKey: ["savedPlans"] });
        toast({ title: "הוסר מהשמורים" });
      }
      return;
    }

    await base44.entities.SavedPlan.create({
      ...plan,
      search_query: searchQuery,
    });
    queryClient.invalidateQueries({ queryKey: ["savedPlans"] });
    toast({ title: "נשמר בהצלחה", description: `תוכנית ${plan.plan_number} נשמרה` });
  };

  const handleClearHistory = async () => {
    for (const s of searchHistory) {
      await base44.entities.SearchHistory.delete(s.id);
    }
    queryClient.invalidateQueries({ queryKey: ["searchHistory"] });
  };

  const handleSelectSearch = (query) => {
    handleSearch(query, "free_text");
  };

  return (
    <div className="min-h-screen bg-background">
      <SearchHero />
      <SearchForm onSearch={handleSearch} isSearching={isSearching} />

      {!results && !gisResults && !isSearching && (
        <RecentSearches
          searches={searchHistory}
          onSelect={handleSelectSearch}
          onClear={handleClearHistory}
        />
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">
        {gisResults ? (
          <JerusalemGisResults data={gisResults.data} query={gisResults.query} />
        ) : (
          <SearchResults
            results={results}
            savedPlanIds={savedPlanIds}
            onSave={handleSavePlan}
            searchQuery={searchQuery}
          />
        )}
      </div>
    </div>
  );
}