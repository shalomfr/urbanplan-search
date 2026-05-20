import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLink, FileText, MapPin, AlertCircle, Building2, Download, Loader2 } from "lucide-react";
import { buildRecordLinks, getPlanDocuments, getRecordDocumentKey } from "@/api/jerusalemGis";

function formatCellValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function RecordDocuments({ categoryId, record }) {
  const docKey = getRecordDocumentKey(categoryId, record);
  const [state, setState] = useState({ status: "idle", docs: [], error: null });

  if (!docKey) return null;

  const loadDocs = async () => {
    setState({ status: "loading", docs: [], error: null });
    try {
      const docs = await getPlanDocuments(docKey.sysId, docKey.tikNum);
      setState({ status: "loaded", docs, error: null });
    } catch (err) {
      setState({ status: "error", docs: [], error: err.message || "שגיאה" });
    }
  };

  if (state.status === "idle") {
    return (
      <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={loadDocs}>
        <FileText className="w-3 h-3" />
        מסמכים
      </Button>
    );
  }
  if (state.status === "loading") {
    return (
      <Button variant="outline" size="sm" className="h-7 text-xs gap-1" disabled>
        <Loader2 className="w-3 h-3 animate-spin" />
        טוען...
      </Button>
    );
  }
  if (state.status === "error") {
    return <span className="text-xs text-destructive">שגיאה: {state.error}</span>;
  }
  if (state.docs.length === 0) {
    return <span className="text-xs text-muted-foreground">אין מסמכים</span>;
  }

  return (
    <div className="flex flex-wrap gap-1 max-w-[400px]">
      {state.docs.map((doc, i) => (
        <a
          key={i}
          href={doc.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 h-7 px-2 text-xs border rounded-md hover:bg-accent transition"
          title={doc.description}
        >
          <Download className="w-3 h-3" />
          {doc.description}
        </a>
      ))}
    </div>
  );
}

function CategoryTable({ category }) {
  const visibleFields = (category.fields || []).filter((f) => f.gisIsVisible);
  const records = category.records || [];

  if (records.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        אין נתונים בקטגוריה זו
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {visibleFields.map((f) => (
              <TableHead key={f.gisIdField} className="text-right text-xs whitespace-nowrap">
                {f.gisFieldAlias}
              </TableHead>
            ))}
            <TableHead className="text-right text-xs">פעולות</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((rec, idx) => {
            const links = buildRecordLinks(category.subTopics, rec).filter(
              (l) => l.kind !== "ArchivInfo"
            );
            return (
              <TableRow key={idx}>
                {visibleFields.map((f) => (
                  <TableCell key={f.gisIdField} className="text-sm whitespace-nowrap">
                    {formatCellValue(rec[f.gisFieldName])}
                  </TableCell>
                ))}
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    <RecordDocuments categoryId={category.id} record={rec} />
                    {links.map((link) => (
                      <Button
                        key={link.id}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => window.open(link.url, "_blank")}
                        title={link.label}
                      >
                        <ExternalLink className="w-3 h-3" />
                        {link.label}
                      </Button>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export default function JerusalemGisResults({ data, query }) {
  if (!data) return null;

  const { generalInfo, uiUrl, categories } = data;
  const nonEmpty = categories.filter((c) => (c.records?.length || 0) > 0);
  const totalRecords = nonEmpty.reduce((sum, c) => sum + c.records.length, 0);

  if (nonEmpty.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-16"
        dir="rtl"
      >
        <AlertCircle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">לא נמצא מידע</h3>
        <p className="text-muted-foreground mb-6">
          לא נמצאו נתונים תכנוניים עבור גוש {query.gush} חלקה {query.helka}
        </p>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => window.open(uiUrl, "_blank")}
        >
          <ExternalLink className="w-4 h-4" />
          פתח במערכת המקורית
        </Button>
      </motion.div>
    );
  }

  return (
    <div dir="rtl">
      {/* Header */}
      <Card className="mb-6 border-primary/30 bg-primary/5">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">
                  ירושלים — גוש {query.gush} / חלקה {query.helka}
                </h2>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {generalInfo?.streetName && (
                  <span>
                    <Building2 className="w-3.5 h-3.5 inline ml-1" />
                    {generalInfo.streetName} {generalInfo.houseNumber}
                  </span>
                )}
                {generalInfo?.schuna && <span>שכונה: {generalInfo.schuna}</span>}
                {generalInfo?.taba && <span>תב"ע: {generalInfo.taba}</span>}
                {generalInfo?.migrash && <span>מגרש: {generalInfo.migrash}</span>}
              </div>
              <p className="mt-3 text-sm">
                <Badge variant="secondary">{totalRecords} רשומות</Badge>
                <span className="mr-2 text-muted-foreground">
                  ב-{nonEmpty.length} קטגוריות
                </span>
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => window.open(uiUrl, "_blank")}
            >
              <ExternalLink className="w-4 h-4" />
              במערכת המקורית
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <Accordion
        type="multiple"
        defaultValue={nonEmpty.filter((c) => c.showByDefault).map((c) => `cat-${c.id}`)}
        className="space-y-2"
      >
        {nonEmpty.map((category) => (
          <AccordionItem
            key={category.id}
            value={`cat-${category.id}`}
            className="border rounded-lg px-4 bg-card"
          >
            <AccordionTrigger className="hover:no-underline py-3">
              <div className="flex items-center gap-3 flex-1">
                <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="font-semibold text-right">{category.label}</span>
                <Badge variant="secondary" className="text-xs">
                  {category.records.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <CategoryTable category={category} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
