import React from "react";
import { motion } from "framer-motion";
import { MapPin, FileText, Building2 } from "lucide-react";

export default function SearchHero() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-bl from-primary via-primary to-blue-800 text-primary-foreground">
      {/* Decorative shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute top-1/2 -right-32 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 rounded-full bg-white/3" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, white 0px, white 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, white 0px, white 1px, transparent 1px, transparent 40px)'
        }} />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 pt-16 pb-20 text-center" dir="rtl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-white/10 backdrop-blur-sm rounded-2xl">
              <FileText className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
            מנוע חיפוש תב״ע
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
            חיפוש תוכניות בניין עיר לפי גוש, חלקה, כתובת, מספר תוכנית או כל מידע אחר
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex items-center justify-center gap-6 mt-8 text-sm text-white/60"
        >
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>כתובת</span>
          </div>
          <div className="w-px h-4 bg-white/20" />
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span>גוש / חלקה</span>
          </div>
          <div className="w-px h-4 bg-white/20" />
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>מספר תוכנית</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}