# ⚡ QUICK REFERENCE - FILE UPLOAD SYSTEM

## 📍 File Upload di Mana Saja?

### Learning Path
```
POST   /api/v1/admin/learning-paths
Form:  title, price, thumbnail (file)
Result: thumbnail_url otomatis saved di learning_paths table
```

### Module  
```
POST   /api/v1/admin/courses/:id/modules
Form:  title, module_type, file (video/ebook)
Result: video_url atau ebook_url otomatis saved di modules table
```

### Article
```
POST   /api/v1/admin/articles
Form:  title, content, author, thumbnail (file)
Result: thumbnail_url otomatis saved di articles table
```

### Certificate
```
PUT    /api/v1/admin/certificates/:id
Form:  certificate (file)
Result: certificate_url otomatis saved di certificates table
```

---

## 🔗 Supabase Bucket Mapping

| Form Input | → | Supabase Bucket | → | Database Field |
|-----------|---|-----------------|----|----|
| thumbnail (Learning Path) | → | `thumbnails/learning-paths/` | → | `learning_paths.thumbnail_url` |
| file (Module Video) | → | `videos/modules/` | → | `modules.video_url` |
| file (Module Ebook) | → | `ebooks/modules/` | → | `modules.ebook_url` |
| thumbnail (Article) | → | `thumbnails/articles/` | → | `articles.thumbnail_url` |
| certificate (Certificate) | → | `certificates/` | → | `certificates.certificate_url` |

---

## 📂 Folder Structure di Supabase

```
🪣 thumbnails
  ├─ learning-paths/[timestamp]-[random].jpg
  └─ articles/[timestamp]-[random].jpg

🪣 videos
  └─ modules/[timestamp]-[random].mp4

🪣 ebooks
  └─ modules/[timestamp]-[random].pdf

🪣 certificates
  └─ [timestamp]-[random].pdf
```

---

## ✅ File Limits

| Bucket | Max | Format |
|--------|-----|--------|
| thumbnails | 5MB | JPG, PNG, GIF, WebP |
| videos | 500MB | MP4, WebM |
| ebooks | 50MB | PDF |
| certificates | 10MB | JPG, PNG, PDF |

---

## 🔄 Update & Delete Behavior

### Update dengan File Baru
```
Old file di Supabase → DELETED
New file uploaded to Supabase
New URL saved to MySQL
```

### Delete Record
```
Record deleted from MySQL
File in Supabase → DELETED
```

### Update tanpa File
```
File tetap di Supabase
No changes
```

---

## 📡 Example Requests

### Create Learning Path
```bash
curl -X POST http://localhost:3000/api/v1/admin/learning-paths \
  -H "Authorization: Bearer [token]" \
  -H "Content-Type: multipart/form-data" \
  -F "title=Web Dev" \
  -F "price=499000" \
  -F "thumbnail=@thumbnail.jpg"
```

### Create Module Video
```bash
curl -X POST http://localhost:3000/api/v1/admin/courses/CR-123/modules \
  -H "Authorization: Bearer [token]" \
  -H "Content-Type: multipart/form-data" \
  -F "title=HTML Basics" \
  -F "module_type=video" \
  -F "estimasi_waktu_menit=60" \
  -F "file=@video.mp4"
```

### Create Article
```bash
curl -X POST http://localhost:3000/api/v1/admin/articles \
  -H "Authorization: Bearer [token]" \
  -H "Content-Type: multipart/form-data" \
  -F "title=Tips Programming" \
  -F "content=Berikut tips..." \
  -F "author=John Doe" \
  -F "thumbnail=@thumb.jpg"
```

---

## 🔑 Key Files

| File | Purpose |
|------|---------|
| `src/utils/uploadToSupabase.js` | Upload logic |
| `src/middlewares/uploadMiddleware.js` | Multer config + validation |
| `src/controllers/learningPathController.js` | LP with upload |
| `src/controllers/moduleController.js` | Module with upload |
| `src/controllers/articleController.js` | Article with upload |
| `src/controllers/certificateController.js` | Certificate with upload |

---

## 🧪 Testing Checklist

- [ ] Create LP with thumbnail
- [ ] Update LP replace thumbnail
- [ ] Create Module video
- [ ] Create Module ebook
- [ ] Update Module replace file
- [ ] Delete Module (verify file gone)
- [ ] Create Article with thumbnail
- [ ] Update Article replace thumbnail
- [ ] Delete Article (verify file gone)
- [ ] Update Certificate with file
- [ ] Delete Certificate (verify file gone)

---

## 📊 Response Format

```json
{
  "id": "LP-123456",
  "title": "Web Development",
  "thumbnail_url": "https://[project].supabase.co/storage/v1/object/public/thumbnails/learning-paths/1701516800000-abc123.jpg",
  "createdAt": "2025-12-02T...",
  "updatedAt": "2025-12-02T..."
}
```

URL format: `https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]/[filename]`

---

## ⚠️ Common Errors

### File type not allowed
```json
{
  "success": false,
  "message": "Tipe file tidak diizinkan. Accepted: image/jpeg, image/png"
}
```

### File too large
```json
{
  "success": false,
  "message": "Ukuran file terlalu besar. Max: 5MB"
}
```

### Upload failed
```json
{
  "success": false,
  "message": "Gagal upload thumbnail.",
  "error": "[error details]"
}
```

---

## 🚀 Quick Setup

1. Create 4 buckets in Supabase (PUBLIC):
   - thumbnails
   - videos
   - ebooks
   - certificates

2. Set .env:
   ```
   SUPABASE_URL=...
   SUPABASE_KEY=...
   ```

3. Done! System ready to use.

---

**For full documentation, see:**
- `API_FILE_UPLOAD_DOCUMENTATION.md` - Detailed API docs
- `IMPLEMENTATION_SUMMARY.md` - Implementation details
- `FINAL_SUMMARY.md` - Complete overview
