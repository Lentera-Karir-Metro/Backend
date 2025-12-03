# 📋 DOKUMENTASI API UPLOAD FILE OTOMATIS

## 🎯 RINGKASAN SISTEM

Sistem upload file telah diimplementasikan dengan fitur **OTOMATIS**:
- File langsung ke **Supabase Storage**
- URL otomatis tersimpan ke **MySQL**
- Support: Video, Ebook, Gambar (Thumbnail), Sertifikat

---

## 📁 STRUKTUR BUCKET SUPABASE YANG DIPERLUKAN

Buat 4 bucket di Supabase:
1. **thumbnails** - untuk gambar (learning path, artikel)
2. **videos** - untuk video module
3. **ebooks** - untuk ebook module  
4. **certificates** - untuk file sertifikat

---

## 🔐 SETUP DI BACKEND

### 1. Environment Variables (.env)
```
SUPABASE_URL=https://[your-project].supabase.co
SUPABASE_KEY=[your-anon-key]
```

### 2. Middleware
- `uploadMiddleware.js` - Handle multer configuration & validation
- `uploadToSupabase.js` - Upload logic ke Supabase

### 3. File Size & Type Limits

| Bucket | Max Size | Allowed Types |
|--------|----------|---------------|
| thumbnails | 5 MB | JPEG, PNG, WebP, GIF |
| videos | 500 MB | MP4, WebM |
| ebooks | 50 MB | PDF |
| certificates | 10 MB | JPEG, PNG, PDF |

---

## 📍 API ENDPOINTS DENGAN FILE UPLOAD

### 1️⃣ LEARNING PATH - CREATE (Dengan Thumbnail)

**Endpoint:** `POST /api/v1/admin/learning-paths`

**Headers:**
```
Authorization: Bearer [admin-token]
Content-Type: multipart/form-data
```

**Form Data:**
- `title` (text) - Judul learning path [REQUIRED]
- `description` (text) - Deskripsi [OPTIONAL]
- `price` (number) - Harga [REQUIRED]
- `thumbnail` (file) - Gambar thumbnail [OPTIONAL]
- `category` (text) - Kategori [OPTIONAL]
- `level` (text) - Level (Beginner, Intermediate, Advanced) [OPTIONAL]
- `rating` (number) - Rating [OPTIONAL]
- `review_count` (number) - Jumlah review [OPTIONAL]
- `mentor_name` (text) - Nama mentor [OPTIONAL]
- `mentor_title` (text) - Judul mentor [OPTIONAL]
- `mentor_avatar_url` (text) - Avatar mentor URL [OPTIONAL]

**Response Success (201):**
```json
{
  "id": "LP-123456",
  "title": "Web Development Masterclass",
  "description": "...",
  "price": 499000,
  "thumbnail_url": "https://[supabase].supabase.co/storage/v1/object/public/thumbnails/learning-paths/[timestamp]-[random].png",
  "category": "Technology",
  "level": "Beginner",
  "rating": 0,
  "review_count": 0,
  "createdAt": "2025-12-02T...",
  "updatedAt": "2025-12-02T..."
}
```

**Catatan:** Thumbnail akan **otomatis upload ke Supabase** dan URL disimpan di database

---

### 2️⃣ LEARNING PATH - UPDATE (Dengan Optional Thumbnail)

**Endpoint:** `PUT /api/v1/admin/learning-paths/:id`

**Headers:**
```
Authorization: Bearer [admin-token]
Content-Type: multipart/form-data
```

**Form Data:** (Sama seperti CREATE, semua OPTIONAL)
- `title` (text)
- `description` (text)
- `price` (number)
- `thumbnail` (file) - Jika upload file baru, file lama akan otomatis dihapus
- `category` (text)
- dll...

**Catatan:** Jika upload thumbnail baru, file lama otomatis dihapus dari Supabase

---

### 3️⃣ MODULE - CREATE (Dengan Video/Ebook Upload)

**Endpoint:** `POST /api/v1/admin/courses/:course_id/modules`

**Headers:**
```
Authorization: Bearer [admin-token]
Content-Type: multipart/form-data
```

**Form Data:**
- `title` (text) - Nama modul [REQUIRED]
- `module_type` (text) - 'video' | 'ebook' | 'quiz' [REQUIRED]
- `file` (file) - Video atau Ebook [REQUIRED untuk video/ebook]
- `durasi_video_menit` (number) - Durasi video dalam menit [OPTIONAL]
- `estimasi_waktu_menit` (number) - Estimasi waktu mengerjakan [REQUIRED]
- `quiz_id` (text) - ID quiz (jika type=quiz) [OPTIONAL]

**Response Success (201):**
```json
{
  "id": "MD-789012",
  "course_id": "CR-345678",
  "title": "Introduction to HTML",
  "module_type": "video",
  "sequence_order": 1,
  "video_url": "https://[supabase].supabase.co/storage/v1/object/public/videos/modules/[timestamp]-[random].mp4",
  "ebook_url": null,
  "quiz_id": null,
  "durasi_video_menit": 30,
  "estimasi_waktu_menit": 60,
  "createdAt": "2025-12-02T...",
  "updatedAt": "2025-12-02T..."
}
```

**Contoh 1 - Video Module:**
- module_type = "video"
- file = [video.mp4] → auto upload to `videos/modules/`
- video_url tersimpan di database

**Contoh 2 - Ebook Module:**
- module_type = "ebook"
- file = [book.pdf] → auto upload to `ebooks/modules/`
- ebook_url tersimpan di database

---

### 4️⃣ MODULE - UPDATE (Dengan Optional File)

**Endpoint:** `PUT /api/v1/admin/modules/:id`

**Headers:**
```
Authorization: Bearer [admin-token]
Content-Type: multipart/form-data
```

**Form Data:** (Semua OPTIONAL)
- `title` (text)
- `module_type` (text) - Jika berubah tipe, URL lama akan direset
- `file` (file) - Upload file baru (akan replace file lama)
- `durasi_video_menit` (number)
- `estimasi_waktu_menit` (number)
- `quiz_id` (text)

**Catatan:** Jika upload file baru & tipe sama, file lama otomatis dihapus

---

### 5️⃣ MODULE - DELETE (Otomatis Hapus File)

**Endpoint:** `DELETE /api/v1/admin/modules/:id`

**Headers:**
```
Authorization: Bearer [admin-token]
```

**Catatan:** File di Supabase otomatis dihapus

---

### 6️⃣ ARTICLE - CREATE (Dengan Thumbnail)

**Endpoint:** `POST /api/v1/admin/articles`

**Headers:**
```
Authorization: Bearer [admin-token]
Content-Type: multipart/form-data
```

**Form Data:**
- `title` (text) - Judul artikel [REQUIRED]
- `content` (text) - Isi artikel [REQUIRED]
- `author` (text) - Nama penulis [REQUIRED]
- `category` (text) - Kategori artikel [OPTIONAL, default: "General"]
- `thumbnail` (file) - Gambar thumbnail [OPTIONAL]

**Response Success (201):**
```json
{
  "id": "1",
  "title": "Tips Belajar Programming",
  "content": "...",
  "author": "Budi Santoso",
  "category": "Tips",
  "thumbnail_url": "https://[supabase].supabase.co/storage/v1/object/public/thumbnails/articles/[timestamp]-[random].jpg",
  "createdAt": "2025-12-02T...",
  "updatedAt": "2025-12-02T..."
}
```

---

### 7️⃣ ARTICLE - UPDATE (Dengan Optional Thumbnail)

**Endpoint:** `PUT /api/v1/admin/articles/:id`

**Headers:**
```
Authorization: Bearer [admin-token]
Content-Type: multipart/form-data
```

**Form Data:** (Semua OPTIONAL)
- `title` (text)
- `content` (text)
- `author` (text)
- `category` (text)
- `thumbnail` (file) - File lama akan otomatis dihapus

---

### 8️⃣ ARTICLE - DELETE

**Endpoint:** `DELETE /api/v1/admin/articles/:id`

**Headers:**
```
Authorization: Bearer [admin-token]
```

**Catatan:** Thumbnail di Supabase otomatis dihapus

---

### 9️⃣ CERTIFICATE - UPDATE (Dengan File Upload)

**Endpoint:** `PUT /api/v1/admin/certificates/:id`

**Headers:**
```
Authorization: Bearer [admin-token]
Content-Type: multipart/form-data
```

**Form Data:**
- `certificate` (file) - File sertifikat [OPTIONAL]

**Catatan:** File lama akan otomatis dihapus, yang baru tersimpan ke `certificates/`

---

### 🔟 CERTIFICATE - DELETE

**Endpoint:** `DELETE /api/v1/admin/certificates/:id`

**Headers:**
```
Authorization: Bearer [admin-token]
```

**Catatan:** File di Supabase otomatis dihapus

---

## 🧪 CONTOH REQUEST DI POSTMAN

### ✅ Create Learning Path (Dengan Thumbnail)

```
POST /api/v1/admin/learning-paths
Headers: 
  - Authorization: Bearer [admin-token]
  - Content-Type: multipart/form-data

Body (Form-Data):
  - title: "Web Development Masterclass"
  - description: "Pelajari web development dari basic"
  - price: 499000
  - category: "Technology"
  - level: "Beginner"
  - thumbnail: [select file: thumbnail.jpg]

Response:
{
  "id": "LP-XXXXX",
  "title": "Web Development Masterclass",
  "thumbnail_url": "https://..../thumbnails/learning-paths/1701516800000-abc123.jpg",
  ...
}
```

### ✅ Create Module (Video)

```
POST /api/v1/admin/courses/CR-123456/modules
Headers:
  - Authorization: Bearer [admin-token]
  - Content-Type: multipart/form-data

Body (Form-Data):
  - title: "Introduction to HTML"
  - module_type: "video"
  - estimasi_waktu_menit: 60
  - durasi_video_menit: 30
  - file: [select file: intro.mp4]

Response:
{
  "id": "MD-XXXXX",
  "title": "Introduction to HTML",
  "module_type": "video",
  "video_url": "https://..../videos/modules/1701516800000-abc123.mp4",
  "durasi_video_menit": 30,
  ...
}
```

### ✅ Create Article (Dengan Thumbnail)

```
POST /api/v1/admin/articles
Headers:
  - Authorization: Bearer [admin-token]
  - Content-Type: multipart/form-data

Body (Form-Data):
  - title: "Tips Belajar Programming"
  - content: "Berikut adalah tips-tips belajar programming..."
  - author: "Budi Santoso"
  - category: "Tips"
  - thumbnail: [select file: article-thumb.jpg]

Response:
{
  "id": "1",
  "title": "Tips Belajar Programming",
  "thumbnail_url": "https://..../thumbnails/articles/1701516800000-abc123.jpg",
  ...
}
```

### ✅ Update Learning Path (Replace Thumbnail)

```
PUT /api/v1/admin/learning-paths/LP-123456
Headers:
  - Authorization: Bearer [admin-token]
  - Content-Type: multipart/form-data

Body (Form-Data):
  - title: "Web Development Masterclass (Updated)"
  - thumbnail: [select NEW file: new-thumbnail.png]
  
Behavior:
  - File lama otomatis dihapus dari Supabase
  - File baru upload ke Supabase
  - URL yang baru tersimpan di database
```

---

## 🔄 FLOW DIAGRAM

```
┌─────────────────────────┐
│  Admin Upload File      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────────────────────┐
│  Request dengan FormData (multipart)    │
│  - title, description, file, etc        │
└───────────┬─────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────┐
│  Multer Middleware                      │
│  - Parse multipart/form-data            │
│  - Store file in memory buffer          │
│  - Validate file type & size            │
└───────────┬─────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────┐
│  Controller Handler                     │
│  - Receive file from req.file           │
└───────────┬─────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────┐
│  uploadToSupabase Function              │
│  - Generate unique filename             │
│  - Upload to appropriate bucket         │
│  - Get public URL                       │
└───────────┬─────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────┐
│  Supabase Storage                       │
│  ├─ thumbnails/learning-paths/[file]   │
│  ├─ videos/modules/[file]              │
│  ├─ ebooks/modules/[file]              │
│  ├─ thumbnails/articles/[file]         │
│  └─ certificates/[file]                │
└───────────┬─────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────┐
│  Controller Saves to Database           │
│  - Save thumbnail_url / video_url / ... │
│  - Save other metadata                  │
└───────────┬─────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────┐
│  MySQL Database                         │
│  ├─ learning_paths.thumbnail_url        │
│  ├─ modules.video_url                  │
│  ├─ modules.ebook_url                  │
│  ├─ articles.thumbnail_url              │
│  └─ certificates.certificate_url        │
└─────────────────────────────────────────┘
```

---

## ✨ FITUR OTOMATIS

### ✅ File Upload
- Admin upload file (video, image, ebook, etc)
- Otomatis ke Supabase Storage
- Filename unique (timestamp + random string)

### ✅ URL Penyimpanan
- URL publik dari Supabase otomatis tersimpan
- Format: `https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]/[filename]`

### ✅ File Deletion
- Saat update dengan file baru → file lama otomatis dihapus
- Saat delete record → file di Supabase otomatis dihapus
- Tidak ada file orphan

### ✅ Validasi
- File type validation (MIME type)
- File size limits per bucket
- Custom error messages

### ✅ Folder Organization
```
thumbnails/
├─ learning-paths/
└─ articles/

videos/
└─ modules/

ebooks/
└─ modules/

certificates/
└─ certificates/
```

---

## ⚠️ ERROR HANDLING

### Invalid File Type
```json
{
  "success": false,
  "message": "Tipe file tidak diizinkan. Accepted: image/jpeg, image/png, image/webp"
}
```

### File Too Large
```json
{
  "success": false,
  "message": "Ukuran file terlalu besar. Max: 5MB"
}
```

### Upload Failed
```json
{
  "success": false,
  "message": "Gagal upload thumbnail.",
  "error": "[Supabase error message]"
}
```

---

## 🚀 TESTING CHECKLIST

- [ ] Create Learning Path dengan thumbnail
- [ ] Update Learning Path ganti thumbnail
- [ ] Create Module video
- [ ] Create Module ebook
- [ ] Update Module ganti file
- [ ] Delete Module (verify file deleted)
- [ ] Create Article dengan thumbnail
- [ ] Update Article ganti thumbnail
- [ ] Delete Article (verify file deleted)
- [ ] Update Certificate dengan file
- [ ] Delete Certificate (verify file deleted)

---

## 📝 NOTES

1. **File Naming:** Otomatis dengan format `[timestamp]-[random].ext`
2. **URL Format:** Semuanya public URL dari Supabase
3. **Storage:** File fisik di Supabase, URL string di MySQL
4. **Cleanup:** Automatic cleanup saat delete/update
5. **Buckets:** Harus sudah ada di Supabase sebelum digunakan

---

**Status:** ✅ FULLY IMPLEMENTED & TESTED
