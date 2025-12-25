# Dokumentasi API LenteraKarir

Dokumentasi ini mencakup seluruh endpoint yang tersedia dalam sistem backend LenteraKarir.

## Autentikasi & Otorisasi
- **User Token**: Digunakan untuk endpoint user biasa. Didapatkan setelah login user.
- **Admin Token**: Digunakan untuk endpoint yang diawali dengan `/admin`. Didapatkan setelah login admin.
- **Header**: `Authorization: Bearer <token>`

---

## 1. Auth (Autentikasi)
Endpoint untuk manajemen akun dan sesi pengguna.

| Method | Endpoint | Deskripsi | Body / Params |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Mendaftar akun baru | `username`, `email`, `password` |
| `GET` | `/api/v1/auth/verify-email` | Verifikasi email pengguna | Query: `token` |
| `POST` | `/api/v1/auth/login` | Login pengguna (User/Admin) | `email`, `password` |
| `POST` | `/api/v1/auth/google` | Login menggunakan Google | `token` (Google ID Token) |
| `POST` | `/api/v1/auth/forgot-password` | Request reset password | `email` |
| `POST` | `/api/v1/auth/reset-password` | Set password baru | `token`, `password` |
| `POST` | `/api/v1/auth/refresh-token` | Refresh access token | `refreshToken` |

---

## 2. Public Catalog (Katalog Publik)
Endpoint yang dapat diakses tanpa login (kecuali beberapa detail spesifik).

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/v1/catalog/learning-paths` | Mengambil daftar semua Learning Path |
| `GET` | `/api/v1/catalog/learning-paths/:id` | Detail Learning Path spesifik |
| `GET` | `/api/v1/articles` | Mengambil daftar semua artikel |
| `GET` | `/api/v1/articles/latest` | Mengambil artikel terbaru |
| `GET` | `/api/v1/articles/categories` | Mengambil daftar kategori artikel |
| `GET` | `/api/v1/articles/category/:category` | Artikel berdasarkan kategori |
| `GET` | `/api/v1/articles/:id` | Detail artikel |

---

## 3. User Dashboard
Endpoint khusus untuk halaman dashboard pengguna setelah login.

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/v1/dashboard/stats` | Statistik user (jumlah kursus, sertifikat, dll) |
| `GET` | `/api/v1/certificates` | Daftar sertifikat milik user |
| `GET` | `/api/v1/certificates/:id` | Detail sertifikat spesifik |
| `GET` | `/api/v1/dashboard/continue-learning` | Kursus yang sedang dipelajari terakhir kali |
| `GET` | `/api/v1/dashboard/recommended` | Rekomendasi kursus untuk user |

---

## 4. Learning (Proses Belajar)
Endpoint untuk interaksi saat pengguna sedang belajar (mengakses materi, kuis).

| Method | Endpoint | Deskripsi | Body / Params |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/learn/dashboard` | Daftar Learning Path yang diikuti user | - |
| `GET` | `/api/v1/learn/ebooks` | Daftar Ebook yang dimiliki user | - |
| `GET` | `/api/v1/learn/learning-paths/:id` | Konten lengkap LP (Module, Quiz) untuk user terdaftar | - |
| `POST` | `/api/v1/learn/modules/:id/complete` | Menandai modul sebagai selesai | - |
| `POST` | `/api/v1/learn/quiz/:id/start` | Memulai sesi kuis baru | - |
| `POST` | `/api/v1/learn/attempts/:id/answer` | Menyimpan jawaban sementara | `question_id`, `option_id` |
| `POST` | `/api/v1/learn/attempts/:id/submit` | Mengumpulkan kuis dan hitung nilai | - |

---

## 5. Payments (Pembayaran)
Integrasi dengan Midtrans.

| Method | Endpoint | Deskripsi | Body |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/payments/checkout` | Membuat transaksi Midtrans | `learning_path_id` |
| `GET` | `/api/v1/payments/status/:order_id` | Cek status pembayaran | - |
| `POST` | `/api/v1/payments/sync` | Sinkronisasi manual status pending | - |

---

## 6. Admin - Learning Paths
Manajemen Learning Path (Kelas Utama).

| Method | Endpoint | Deskripsi | Body (Multipart/JSON) |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/admin/learning-paths` | Buat LP baru | `title`, `price`, `status`, `thumbnail` (file) |
| `GET` | `/api/v1/admin/learning-paths` | List semua LP (Filter & Pagination) | Query: `page`, `limit`, `status` |
| `GET` | `/api/v1/admin/learning-paths/:id` | Detail LP untuk Admin | - |
| `PUT` | `/api/v1/admin/learning-paths/:id` | Update LP | `title`, `status`, dll |
| `DELETE` | `/api/v1/admin/learning-paths/:id` | Hapus LP (Soft delete) | - |

---

## 7. Admin - Courses & Modules
Manajemen Kursus (Bab) dan Modul (Materi) di dalam Learning Path.

| Method | Endpoint | Deskripsi | Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/courses` | List semua Course (untuk dropdown) | - |
| `POST` | `/api/v1/admin/learning-paths/:id/courses` | Tambah Course ke LP | `title`, `description` |
| `POST` | `/api/v1/admin/learning-paths/:id/reorder-courses` | Ubah urutan Course | `course_ids` (array) |
| `PUT` | `/api/v1/admin/courses/:id` | Update Course | `title` |
| `DELETE` | `/api/v1/admin/courses/:id` | Hapus Course | - |
| `POST` | `/api/v1/admin/courses/:id/modules` | Tambah Modul (Video/Ebook) | `title`, `type`, `file` (upload) |
| `POST` | `/api/v1/admin/courses/:id/quizzes` | Tambah Kuis ke Course | `title`, `questions` (JSON) |
| `POST` | `/api/v1/admin/courses/:id/reorder-modules` | Ubah urutan Modul | `module_ids` (array) |
| `PUT` | `/api/v1/admin/modules/:id` | Update Modul | `title` |
| `DELETE` | `/api/v1/admin/modules/:id` | Hapus Modul | - |

---

## 8. Admin - Quizzes (Bank Soal)
Manajemen detail Kuis, Pertanyaan, dan Jawaban.

| Method | Endpoint | Deskripsi | Body |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/admin/quizzes` | Buat Kuis Standalone | `title`, `course_id`, `passing_score` |
| `GET` | `/api/v1/admin/quizzes` | List Kuis | - |
| `GET` | `/api/v1/admin/quizzes/:id` | Detail Kuis | - |
| `PUT` | `/api/v1/admin/quizzes/:id` | Update Info Kuis | `title` |
| `DELETE` | `/api/v1/admin/quizzes/:id` | Hapus Kuis | - |
| `POST` | `/api/v1/admin/quizzes/:id/questions` | Tambah Pertanyaan | `question_text`, `type` |
| `PUT` | `/api/v1/admin/questions/:id` | Update Pertanyaan | `question_text` |
| `DELETE` | `/api/v1/admin/questions/:id` | Hapus Pertanyaan | - |
| `POST` | `/api/v1/admin/questions/:id/options` | Tambah Opsi Jawaban | `option_text`, `is_correct` |
| `PUT` | `/api/v1/admin/options/:id` | Update Opsi | `option_text` |
| `DELETE` | `/api/v1/admin/options/:id` | Hapus Opsi | - |

---

## 9. Admin - User Management
Mengelola pengguna terdaftar.

| Method | Endpoint | Deskripsi | Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/users` | List semua user | - |
| `PUT` | `/api/v1/admin/users/:id` | Update data user | `username` |
| `POST` | `/api/v1/admin/users/:id/deactivate` | Nonaktifkan user | - |
| `POST` | `/api/v1/admin/users/:id/reset-password` | Trigger reset password email | - |
| `POST` | `/api/v1/admin/users/:id/enroll` | Enroll manual user ke kelas | `learning_path_id` |

---

## 10. Admin - Dashboard & Reports
Statistik dan Laporan untuk Admin.

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/v1/admin/dashboard/stats` | Statistik utama dashboard |
| `GET` | `/api/v1/admin/dashboard/recent-transactions` | Transaksi terbaru |
| `GET` | `/api/v1/admin/dashboard/user-growth` | Grafik pertumbuhan user |
| `GET` | `/api/v1/admin/dashboard/enrollment-stats` | Statistik pendaftaran |
| `GET` | `/api/v1/admin/reports/user-analytics` | Analisa user mendalam |
| `GET` | `/api/v1/admin/reports/course-performance` | Performa kursus |
| `GET` | `/api/v1/admin/reports/class-performance` | **(Baru)** Jumlah siswa per kelas |
| `GET` | `/api/v1/admin/reports/student-performance` | **(Baru)** Progress belajar siswa |
| `GET` | `/api/v1/admin/reports/sales-report` | Laporan penjualan |

---

## 11. Admin - Transactions
Manajemen Transaksi Pembayaran.

| Method | Endpoint | Deskripsi | Params |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/transactions` | **(Baru)** List semua transaksi | `page`, `limit`, `search`, `status` |

---

## 12. Admin - Certificates
Manajemen Sertifikat, Template, dan Generator.

| Method | Endpoint | Deskripsi | Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/certificates/admin/templates` | **(Baru)** List Template Sertifikat | - |
| `POST` | `/api/v1/certificates/admin/templates` | **(Baru)** Upload Template Baru | `name`, `template` (file) |
| `POST` | `/api/v1/certificates/admin/generate` | **(Baru)** Generate Manual (Single) | `participant_name`, `class_title`, dll |
| `POST` | `/api/v1/certificates/admin/bulk-generate` | **(Baru)** Generate Massal (Bulk) | `file` (CSV) |
| `PUT` | `/api/v1/certificates/admin/certificates/:id` | Update file sertifikat user | `certificate` (file) |
| `DELETE` | `/api/v1/certificates/admin/certificates/:id` | Hapus sertifikat user | - |

---

## 13. Admin - Batch Operations
Operasi massal untuk efisiensi.

| Method | Endpoint | Deskripsi | Body |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/admin/batch/users/delete` | Hapus banyak user | `ids` (array) |
| `POST` | `/api/v1/admin/batch/users/deactivate` | Nonaktifkan banyak user | `ids` (array) |
| `POST` | `/api/v1/admin/batch/courses/delete` | Hapus banyak course | `ids` (array) |
| `POST` | `/api/v1/admin/batch/learning-paths/delete` | Hapus banyak LP | `ids` (array) |
| `POST` | `/api/v1/admin/batch/learning-paths/update-status` | Update status banyak LP | `ids`, `status` |

---

## 14. Admin - Articles
Manajemen Artikel Blog/Berita.

| Method | Endpoint | Deskripsi | Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/articles/admin/articles` | List artikel (Admin view) | - |
| `POST` | `/api/v1/articles/admin/articles` | Buat artikel baru | `title`, `content`, `thumbnail` |
| `PUT` | `/api/v1/articles/admin/articles/:id` | Update artikel | - |
| `DELETE` | `/api/v1/articles/admin/articles/:id` | Hapus artikel | - |

---

## 15. Webhooks
Endpoint untuk menerima notifikasi dari layanan pihak ketiga.

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `POST` | `/api/v1/webhooks/midtrans` | Menerima status pembayaran dari Midtrans |
| `POST` | `/api/v1/webhooks/supabase/user-deleted` | Sinkronisasi hapus user dari Supabase Auth |
