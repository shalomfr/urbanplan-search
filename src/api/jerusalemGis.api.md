# Jerusalem GIS API (jergisinfohub.jerusalem.muni.il)

API פנימי שמשרת את מערכת "מידע תכנוני" של עיריית ירושלים. תועד באמצעות reverse-engineering של ה-UI ב-`/UI/GisMeidaT/index.html`.

## Base URL

```
https://jergisinfohub.jerusalem.muni.il/Services/api
```

## פרמטרים חובה

| פרמטר | חובה | תיאור |
|---|---|---|
| `gush` | **כן** | מספר גוש קדסטרי |
| `helka` | **כן** | מספר חלקה בגוש |
| `street`, `house`, `taba`, `migrash`, `schuna`, `x`, `y`, `xMin`/`yMin`/`xMax`/`yMax` | לא | פרמטרים אופציונליים — לזיהוי מדויק יותר ולזום במפה. נדרשים רק בעת שימוש בדף ה-UI עצמו |

**מבחן שאומת:** קריאה ל-`MetaDataObjectsDetails/12?gush=30061&helka=4` מחזירה את אותה רשימת תב"עות (7 רשומות) כמו הקריאה עם כל הפרמטרים.

## Endpoints

### 1. `GET /GetGeneralInfo?gush=&helka=&...`
מחזיר מטה-דאטה כללית על המיקום (שם רחוב, שכונה, X/Y). יחזיר ערכים ריקים אם רק `gush`+`helka` סופקו.

### 2. `GET /MetaDataObjects?gush=&helka=&...`
מחזיר את רשימת הקטגוריות הזמינות עבור המיקום:
```json
[ { "IdInformMain": 12 }, { "IdInformMain": 13 }, ... ]
```

### 3. `GET /MetaDataObjectsDetails/{id}?gush=&helka=&...`
מחזיר את הנתונים הממשיים של הקטגוריה:
```json
{
  "gisObjectID": 12,
  "gisObjectName": "YeudayKarka",
  "gisObjectAlias": "תב\"ע",
  "gisShowTableByDefault": true,
  "gisDataObject": [ { ...record1... }, { ...record2... } ]
}
```

### 4. `GET /MetaDataFields/{id}`
מחזיר את הסכמה של הקטגוריה — שמות שדות, aliases בעברית, וסוגי נתונים. לא דורש פרמטרי מיקום.

### 5. `GET /GetSubTopic/{id}`
מחזיר את רשימת ה"קישורים המשניים" עבור כל רשומה בקטגוריה — דרכים להציג מסמכים, החלטות ועדה, ארכיב אופטי וכו'. ה-URL מכיל placeholders כמו `{0}` שצריך להחליף בערכי השדות מהרשומה.

## מיפוי 11 הקטגוריות

| ID | gisObjectName | gisObjectAlias | תיאור |
|---|---|---|---|
| 1 | `RishuiBniya` | רישוי בניה | היתרי בניה שהוגשו לחלקה |
| 6 | `PikuachBniya` | עבירות בניה | תיקי פיקוח ועבירות בניה |
| 12 | `YeudayKarka` | תב"ע | תב"עות החלות על המגרש (החשובה ביותר) |
| 13 | `Migrashim` | מגרשים | זכויות בניה, ייעוד קרקע, שטח, אחוזי בניה |
| 14 | `KaveyBniyan` | מידע להיתר | בקשות מידע לקראת היתר |
| 16 | `Tazar` | תצ"ר | תצריפי רישום (תכניות חלוקה) |
| 23 | `AtarimLeshimur` | רשימת השימור | מבנים לשימור |
| 40 | `TohniyotAvShunati` | תכניות אב ומתאר שכונתיות | |
| 47 | `YeudayKarkaCityAll` | תוכניות החלות על כל העיר | תוכניות רוחב עירוניות |
| 50 | `TochnitMechuziVeartzi` | תוכניות מחוזיות וארציות | תמ"ם, תמ"א |
| 84 | `ShimurChavatDaat` | חוות דעת שימור | חוות דעת של מחלקת שימור |

## מסמכי PDF וקישורים משניים

`GetSubTopic/{id}` מחזיר רשימת sub-topics. ב-`UrlPage` יש URLs שמובילים למערכת `ykpubdata.jerusalem.muni.il` (מערכת מידע ציבורי נפרדת).

### דוגמה לתב"ע (קטגוריה 12)

עבור תב"ע מספר `4836`:
```
https://ykpubdata.jerusalem.muni.il/#/Rishui/ArchivInfo?TikNum=4836&SystemCode=26400001  ← מסמכי תוכנית (PDF)
https://ykpubdata.jerusalem.muni.il/#/Rishui/ProcessInfo?TikNum=4836&SystemCode=26400001  ← תהליך אישור
https://ykpubdata.jerusalem.muni.il/#/Rishui/VahadaInfo?TikNum=4836&SystemCode=26400001   ← החלטות ועדה
```

### מיפוי SystemCode

| SystemCode | מערכת |
|---|---|
| 26400001 | תב"ע (תוכניות) |
| 26400023 | תצ"ר |
| 26400024 | מידע להיתר |
| 26400046 | רישוי בניה |
| 26400056 | פיקוח / עבירות בניה |
| 26400086 | חוות דעת שימור |
| 26400230 | אתרים לשימור |

## קישור UI מינימלי

```
https://jergisinfohub.jerusalem.muni.il/UI/GisMeidaT/index.html?gush=30061&helka=4
```

## CORS

ה-API מאפשר קריאות cross-origin ישירות מהדפדפן (אומת ב-puppeteer מ-origin אחר). אין צורך בproxy לצורך GET requests.
