import React, { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MapPin, Hash, FileText, Loader2 } from "lucide-react";

const SEARCH_TYPES = [
  { value: "free_text", label: "חיפוש חופשי", icon: Search, placeholder: "חפש לפי כתובת, גוש, חלקה, מספר תוכנית או כל דבר אחר..." },
  { value: "gush_helka", label: "גוש / חלקה", icon: Hash, placeholder: "" },
  { value: "address", label: "כתובת", icon: MapPin, placeholder: "לדוגמה: רחוב הרצל 5, תל אביב" },
  { value: "plan_number", label: "מספר תוכנית", icon: FileText, placeholder: "לדוגמה: תא/3000" },
];

export default function SearchForm({ onSearch, isSearching }) {
  const [searchType, setSearchType] = useState("free_text");
  const [freeText, setFreeText] = useState("");
  const [gush, setGush] = useState("");
  const [helka, setHelka] = useState("");
  const [address, setAddress] = useState("");
  const [planNumber, setPlanNumber] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    let query = "";
    switch (searchType) {
      case "free_text":
        query = freeText;
        break;
      case "gush_helka":
        query = `גוש ${gush}${helka ? ` חלקה ${helka}` : ""}`;
        break;
      case "address":
        query = address;
        break;
      case "plan_number":
        query = planNumber;
        break;
    }
    if (query.trim()) {
      onSearch(query.trim(), searchType);
    }
  };

  const currentType = SEARCH_TYPES.find(t => t.value === searchType);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="max-w-3xl mx-auto -mt-10 px-4 relative z-10"
      dir="rtl"
    >
      <div className="bg-card rounded-2xl shadow-xl border p-6 md:p-8">
        <Tabs value={searchType} onValueChange={setSearchType} className="mb-6">
          <TabsList className="w-full grid grid-cols-4 h-auto p-1">
            {SEARCH_TYPES.map(type => (
              <TabsTrigger
                key={type.value}
                value={type.value}
                className="flex items-center gap-1.5 text-xs md:text-sm py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <type.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{type.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <form onSubmit={handleSubmit}>
          {searchType === "free_text" && (
            <Input
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              placeholder={currentType.placeholder}
              className="h-14 text-base px-5 rounded-xl"
              autoFocus
            />
          )}

          {searchType === "gush_helka" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">גוש</label>
                <Input
                  value={gush}
                  onChange={(e) => setGush(e.target.value)}
                  placeholder="מספר גוש"
                  className="h-14 text-base px-5 rounded-xl"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">חלקה</label>
                <Input
                  value={helka}
                  onChange={(e) => setHelka(e.target.value)}
                  placeholder="מספר חלקה (אופציונלי)"
                  className="h-14 text-base px-5 rounded-xl"
                />
              </div>
            </div>
          )}

          {searchType === "address" && (
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={currentType.placeholder}
              className="h-14 text-base px-5 rounded-xl"
              autoFocus
            />
          )}

          {searchType === "plan_number" && (
            <Input
              value={planNumber}
              onChange={(e) => setPlanNumber(e.target.value)}
              placeholder={currentType.placeholder}
              className="h-14 text-base px-5 rounded-xl"
              autoFocus
            />
          )}

          <Button
            type="submit"
            disabled={isSearching}
            className="w-full h-14 mt-4 rounded-xl text-base font-semibold gap-2 bg-primary hover:bg-primary/90"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                מחפש תוכניות...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                חפש תוכניות תב״ע
              </>
            )}
          </Button>
        </form>
      </div>
    </motion.div>
  );
}