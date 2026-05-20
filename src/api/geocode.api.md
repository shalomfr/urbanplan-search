# GovMap Autocomplete API

API ציבורי של GovMap (govmap.gov.il) להשלמת כתובות וחיפוש גושים/חלקות.

## Endpoint

```
POST https://www.govmap.gov.il/api/search-service/autocomplete
Content-Type: application/json

{
  "searchText": "הנביאים 40 ירושלים",
  "language": "he"
}
```

## CORS

**פתוח לכל origin** — אומת מ-example.com.

## תגובה

```json
{
  "resultsCount": 153,
  "results": [
    {
      "id": "address|ADDR|53562662",
      "text": "הנביאים 40 ירושלים",
      "type": "address",
      "score": 3270.114,
      "shape": "POINT(3921046.92 3735003.74)",
      "data": {},
      "originalText": "..."  // אופציונלי
    }
  ],
  "aggregations": [
    { "key": "address", "count": 13 },
    { "key": "street", "count": 1 },
    { "key": "parcel", "count": 13 }
  ]
}
```

## סוגי תוצאות

| `type` | תיאור | דוגמה |
|---|---|---|
| `address` | כתובת מלאה | "הנביאים 40 ירושלים" |
| `parcel` | חלקה בגוש | "גוש 30061 חלקה 4" |
| `street` | שם רחוב | "הנביאים, ירושלים" |

## חיפוש parcel ישיר

טקסט בצורה "גוש X חלקה Y" יחזיר תוצאות parcel:
```json
{
  "id": "parcel|LAYER_PARCEL_ALL|865581",
  "text": "גוש 30016 חלקה 4",
  "type": "parcel",
  "shape": "POINT(...)"
}
```

## קואורדינטות

`shape: "POINT(x y)"` הוא ב-**EPSG:3857 (Web Mercator)**, לא ITM. להמרה ל-ITM (EPSG:2039) שדורש Jerusalem GIS, יש להשתמש בספריה כמו `proj4js`.

## מגבלות

- אין endpoint ציבורי לזיהוי gush/helka מ-X/Y (`/api/layers-catalog/identify` מחזיר `access denied` בלי auth).
- לכן לא ניתן להמיר address ישירות ל-gush/helka דרך GovMap בלבד — רק אם המשתמש מקליד "גוש X חלקה Y" ובוחר תוצאה מסוג parcel.

## דוגמת שימוש בקוד

ראה [geocode.js](./geocode.js) — פונקציות `geocodeAutocomplete()`, `extractGushHelkaFromText()`, `parsePoint()`.
