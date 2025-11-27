# Panduan Menggunakan Postman Collection - LenteraKarir API

## 📋 Daftar Isi
1. [Setup Awal](#setup-awal)
2. [Import Collection](#import-collection)
3. [Konfigurasi Variables](#konfigurasi-variables)
4. [Cara Testing Endpoint](#cara-testing-endpoint)
5. [Contoh Workflow Testing](#contoh-workflow-testing)
6. [Troubleshooting](#troubleshooting)

---

## Setup Awal

### Prasyarat
- **Postman** sudah terinstall ([Download di sini](https://www.postman.com/downloads/))
- **Backend server** sudah running di `http://localhost:3000`
- **Database MySQL** sudah siap dengan migrations
- **Token Supabase** (admin dan user) sudah tersedia

### Memastikan Server Berjalan

Buka terminal di folder backend dan jalankan:

```bash
npm install
npm run dev
```

Atau jika tidak ada script `dev`:

```bash
node app.js
```

**Verifikasi server berjalan:**
```bash
curl http://localhost:3000/api/v1/test
```

Response harusnya:
```json
{ "message": "API Backend Lentera Karir Berhasil!" }
```

---

## Import Collection

### Langkah 1: Buka Postman

Jalankan aplikasi Postman.

### Langkah 2: Buka Import Dialog

Klik tombol **Import** di bagian atas kiri:
- **Postman Desktop**: Menu → File → Import (atau Ctrl+O)
- **Postman Web**: Click tombol Import di toolbar

### Langkah 3: Pilih File Collection

1. Di dialog import, pilih tab **File**
2. Browse ke folder `e:\lentera-karir-backend\`
3. Pilih file `Postman-Collection-LenteraKarir.json`
4. Klik **Import**

### Langkah 4: Konfirmasi Import

Postman akan menampilkan preview collection. Klik **Import** untuk confirm.

**Hasil:** Collection "LenteraKarir API" akan muncul di sidebar kiri Postman.

---

## Konfigurasi Variables

Variables di Postman memungkinkan Anda menggunakan placeholder (misal `{{baseUrl}}`) dan tidak perlu hardcode nilai di setiap request.

### Langkah 1: Buka Collection Variables

1. Di sidebar kiri, cari collection **"LenteraKarir API"**
2. Klik icon **ellipsis (...)** di sebelah nama collection
3. Pilih **"Edit"**

### Langkah 2: Isi Tab Variables

Pada tab **"Variables"**, Anda akan melihat tabel dengan kolom:
- **VARIABLE** (nama variabel)
- **INITIAL VALUE** (nilai default)
- **CURRENT VALUE** (nilai aktif)

**Isi nilai sesuai environment Anda:**

| Variabel | Nilai |
|----------|-------|
| `baseUrl` | `http://localhost:3000` |
| `adminToken` | `(paste JWT token admin dari Supabase)` |
| `userToken` | `(paste JWT token user dari Supabase)` |
| `lpId` | `LP-XXXXXX` (akan diisi saat testing) |
| `courseId` | `CR-XXXXXX` (akan diisi saat testing) |
| `moduleId` | `MD-XXXXXX` (akan diisi saat testing) |
| `quizId` | `QZ-XXXXXX` (akan diisi saat testing) |
| `userId` | `LT-XXXXXX` (akan diisi saat testing) |
| `refreshToken` | `(paste refresh token dari Supabase)` |

### Langkah 3: Cara Mendapatkan Token Supabase

#### Opsi A: Login via Frontend
Jika frontend NextAuth sudah siap:
1. Login di frontend dengan akun admin/user
2. Buka DevTools (F12) → Application/Storage
3. Cari `supabase-auth-token` atau di localStorage
4. Copy `access_token` dan `refresh_token`
5. Paste ke Postman variables

#### Opsi B: Langsung dari Supabase Dashboard
1. Buka [Supabase Dashboard](https://app.supabase.com)
2. Login ke project Anda
3. Navigate ke **Authentication** → **Users**
4. Pilih user yang ingin di-test
5. Copy User ID → gunakan sebagai identifier

#### Opsi C: Generate Token Manual (Testing)
Gunakan Supabase CLI atau Postman untuk generate token:

**Request Supabase Auth Endpoint:**

```
POST https://YOUR-SUPABASE-URL/auth/v1/token?grant_type=password

Content-Type: application/x-www-form-urlencoded

email=user@example.com&password=password123
```

Response akan berisi `access_token` yang bisa digunakan.

### Langkah 4: Save Variables

Klik tombol **Save** (atau Ctrl+S) untuk menyimpan.

---

## Cara Testing Endpoint

### Struktur Request di Postman

Setiap request di collection memiliki:
- **Method** (GET, POST, PUT, DELETE)
- **URL** dengan variables (contoh: `{{baseUrl}}/api/v1/auth/sync`)
- **Headers** (Content-Type, Authorization)
- **Body** (untuk POST/PUT/PATCH requests)

### Langkah Testing Sederhana

#### 1. Testing Endpoint Public (Tanpa Auth)

**Contoh: List Learning Paths**

```
GET {{baseUrl}}/api/v1/catalog/learning-paths
```

Langkah:
1. Di collection sidebar, buka **Public Catalog** → **List Learning Paths**
2. Klik tombol **Send**
3. Lihat response di panel bawah

Expected Response (200 OK):
```json
[
  {
    "id": "LP-123456",
    "title": "Belajar Node.js",
    "description": "Kurikulum lengkap Node.js",
    "price": 100000,
    "createdAt": "2025-11-27T10:00:00Z"
  }
]
```

#### 2. Testing Endpoint dengan Authorization

**Contoh: Create Learning Path (Admin Only)**

```
POST {{baseUrl}}/api/v1/admin/learning-paths

Headers:
- Content-Type: application/json
- Authorization: Bearer {{adminToken}}

Body (raw JSON):
{
  "title": "Belajar React",
  "description": "Framework React untuk Frontend",
  "price": 150000
}
```

Langkah:
1. Di collection, buka **Admin: Learning Paths** → **Create Learning Path**
2. Klik tab **Headers** — pastikan header sudah ada (biasanya auto-filled)
3. Klik tab **Body** — edit JSON sesuai kebutuhan
4. Klik **Send**

Expected Response (201 Created):
```json
{
  "id": "LP-XXXXXX",
  "title": "Belajar React",
  "description": "Framework React untuk Frontend",
  "price": 150000,
  "createdAt": "2025-11-27T10:05:00Z",
  "updatedAt": "2025-11-27T10:05:00Z"
}
```

**Tip:** Copy ID dari response (`"id": "LP-XXXXXX"`), lalu set ke Postman variable `lpId` untuk request berikutnya.

---

## Contoh Workflow Testing

Workflow ini menunjukkan urutan testing yang logis dari pembuatan learning path hingga checkout.

### Workflow: Dari Admin Setup hingga User Enrollment

#### **Fase 1: Admin Setup Learning Path**

**Step 1: Create Learning Path**
- Request: `POST /api/v1/admin/learning-paths`
- Body:
  ```json
  {
    "title": "Belajar Node.js",
    "description": "Kurikulum lengkap Node.js",
    "price": 100000
  }
  ```
- Simpan `lpId` dari response

**Step 2: Create Course di Learning Path**
- Request: `POST /api/v1/admin/learning-paths/{{lpId}}/courses`
- Body:
  ```json
  {
    "title": "Dasar JavaScript",
    "description": "Modul pengantar JavaScript"
  }
  ```
- Simpan `courseId` dari response

**Step 3: Create Module di Course**
- Request: `POST /api/v1/admin/courses/{{courseId}}/modules`
- Body:
  ```json
  {
    "title": "Pengenalan Async/Await",
    "content": "Belajar tentang Promise dan async/await di JavaScript"
  }
  ```
- Simpan `moduleId` dari response

**Step 4: Create Quiz**
- Request: `POST /api/v1/admin/quizzes`
- Body:
  ```json
  {
    "title": "Quiz Modul 1",
    "pass_threshold": 0.70
  }
  ```
- Simpan `quizId` dari response

**Step 5: Add Question to Quiz**
- Request: `POST /api/v1/admin/quizzes/{{quizId}}/questions`
- Body:
  ```json
  {
    "question_text": "Apa itu async/await?"
  }
  ```
- Simpan `questionId` dari response

**Step 6: Add Options to Question**
- Request: `POST /api/v1/admin/questions/{{questionId}}/options`
- Body (untuk opsi benar):
  ```json
  {
    "option_text": "Cara menulis kode asinkron yang lebih mudah dibaca",
    "is_correct": true
  }
  ```
- Ulangi untuk opsi salah dengan `"is_correct": false`

---

#### **Fase 2: User Sync & Enrollment**

**Step 1: Sync User ke MySQL**
- Request: `POST /api/v1/auth/sync`
- Headers: `Authorization: Bearer {{userToken}}`
- Body:
  ```json
  {}
  ```
- Response akan berisi user data dari MySQL

**Step 2: Checkout / Create Payment**
- Request: `POST /api/v1/payments/checkout`
- Headers: `Authorization: Bearer {{userToken}}`
- Body:
  ```json
  {
    "learning_path_id": "{{lpId}}"
  }
  ```
- Response berisi Midtrans snap token

**Step 3: Simulate Webhook (Optional - untuk testing local)**
- Request: `POST /api/v1/webhooks/midtrans`
- Headers: `Content-Type: application/json`
- Body:
  ```json
  {
    "order_id": "LENTERA-EN-XXXXXX",
    "transaction_status": "settlement",
    "fraud_status": "accept",
    "transaction_id": "123456789",
    "metadata": {
      "user_id": "{{userId}}",
      "learning_path_id": "{{lpId}}"
    }
  }
  ```
- Response: `{ "message": "Notifikasi berhasil diproses" }`

---

#### **Fase 3: User Learning & Quiz**

**Step 1: Get User Dashboard**
- Request: `GET /api/v1/learn/dashboard`
- Headers: `Authorization: Bearer {{userToken}}`
- Response: List learning paths yang sudah di-enroll user

**Step 2: Get Learning Path Content**
- Request: `GET /api/v1/learn/learning-paths/{{lpId}}`
- Headers: `Authorization: Bearer {{userToken}}`
- Response: Full curriculum dengan status progress

**Step 3: Mark Module as Complete**
- Request: `POST /api/v1/learn/modules/{{moduleId}}/complete`
- Headers: `Authorization: Bearer {{userToken}}`
- Body:
  ```json
  {
    "progress_data": {}
  }
  ```

**Step 4: Start Quiz**
- Request: `POST /api/v1/learn/quiz/{{quizId}}/start`
- Headers: `Authorization: Bearer {{userToken}}`
- Body: `{}`
- Response akan berisi `attempt_id` — simpan sebagai `attemptId`

**Step 5: Save Quiz Answer**
- Request: `POST /api/v1/learn/attempts/{{attemptId}}/answer`
- Headers: `Authorization: Bearer {{userToken}}`
- Body:
  ```json
  {
    "question_id": "{{questionId}}",
    "selected_option": "{{optionId}}"
  }
  ```

**Step 6: Submit Quiz**
- Request: `POST /api/v1/learn/attempts/{{attemptId}}/submit`
- Headers: `Authorization: Bearer {{userToken}}`
- Body:
  ```json
  {
    "answers": []
  }
  ```
- Response: Score dan hasil quiz

---

## Troubleshooting

### Masalah 1: "404 Not Found"

**Penyebab umum:**
- Server tidak jalan
- Port salah (gunakan 3000, bukan 3001)
- Endpoint URL typo

**Solusi:**
1. Pastikan server jalan: `curl http://localhost:3000/api/v1/test`
2. Periksa `baseUrl` di Postman variables
3. Periksa route di `src/routes/*.js` apakah endpoint match

---

### Masalah 2: "401 Unauthorized"

**Penyebab:**
- Token tidak ada atau expired
- Header `Authorization` salah format

**Solusi:**
1. Periksa Postman variable `adminToken` atau `userToken` sudah diisi
2. Pastikan format header: `Bearer {{adminToken}}` (ada spasi)
3. Regenerate token dari Supabase jika sudah kadaluarsa (biasanya 1 jam)
4. Di request body atau headers, jangan hardcode token — gunakan variable

---

### Masalah 3: "400 Bad Request"

**Penyebab:**
- Body JSON format salah
- Missing required fields
- Tipe data tidak sesuai

**Solusi:**
1. Klik tab **Body** di Postman
2. Pastikan format JSON valid (gunakan validator online jika perlu)
3. Baca error message di response untuk detail field mana yang bermasalah
4. Periksa controller schema / validation di backend

---

### Masalah 4: Variabel Tidak Terisi di URL

**Penyebab:**
- Variable name typo (case-sensitive)
- Variable belum di-define di collection

**Solusi:**
1. Pastikan nama variable menggunakan `{{namaVariable}}` (double curly braces)
2. Di collection editor, tab Variables, pastikan variable name match
3. Klik tombol **Save** setelah edit

---

### Masalah 5: Token Supabase Tidak Tahu Caranya

**Solusi Alternatif — Test Dengan Curl:**

```bash
curl -X POST https://YOUR-SUPABASE-URL/auth/v1/token?grant_type=password \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=admin@example.com&password=password123"
```

Response:
```json
{
  "access_token": "eyJhbGci...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "r.abc...",
  "user": { ... }
}
```

Copy `access_token` → paste ke Postman variable `adminToken`.

---

## Tips & Tricks

### 1. Menggunakan Pre-request Scripts (Otomatisasi)

Anda bisa membuat script untuk otomatis copy response ID ke variable:

1. Di request, klik tab **Tests**
2. Paste script:
   ```javascript
   var jsonData = pm.response.json();
   pm.collectionVariables.set("lpId", jsonData.id);
   ```
3. Setelah request sukses, `lpId` otomatis ter-update

---

### 2. Membuat Environment Berbeda

Untuk testing di environment berbeda (dev, staging, prod):

1. Di Postman, buat **Environment** baru:
   - Klik icon gigi (settings) → Environments → Create
2. Isi baseUrl berbeda untuk masing-masing environment
3. Pilih environment di dropdown kanan atas

---

### 3. Menjalankan Requests Beruntun (Collection Runner)

Untuk run semua requests otomatis:

1. Di sidebar, klik icon **Runner** (atau Collections → Run Collection)
2. Pilih collection "LenteraKarir API"
3. Pilih environment
4. Atur delay antar request (misal 100ms)
5. Klik **Run Collection**

---

### 4. Export Results ke Report

Setelah run collection:
1. Klik **Export Results** 
2. Pilih format (JSON, CSV, HTML)
3. Save untuk dokumentasi

---

## Referensi Cepat

### Endpoint Categories

| Kategori | Untuk | Auth |
|----------|-------|------|
| **Auth** | Login, Sync User | Admin/User |
| **Public Catalog** | Browse courses | No |
| **Admin: Learning Paths** | CRUD Learning Path | Admin |
| **Admin: Courses & Modules** | CRUD Course/Module | Admin |
| **Admin: Quiz Engine** | CRUD Quiz, Q&A, Options | Admin |
| **Admin: User Management** | Manage users, manual enroll | Admin |
| **Payments** | Create checkout session | User |
| **Webhooks** | Handle callbacks | No |
| **Learning (User)** | Dashboard, content access | User |
| **Quiz: Learning Flow** | Start/submit quiz | User |

---

## Kontak & Support

Jika ada error atau pertanyaan:
1. Cek log backend di terminal: `npm run dev`
2. Baca error message detail di Postman response
3. Verifikasi database migration sudah run: `npm run migrate`

---

**Last Updated:** 27 Nov 2025  
**Postman Collection Version:** 2.1.0
