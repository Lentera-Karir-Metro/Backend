# Webhook Midtrans Configuration Guide

## Masalah yang Terjadi

Ketika transaksi di Midtrans sudah **settlement** tapi status enrollment di database masih **pending**, ini berarti **webhook Midtrans tidak berjalan**.

### Mengapa Webhook Tidak Berjalan?

1. **Webhook URL belum dikonfigurasi di Midtrans Dashboard**
2. **Server backend tidak dapat diakses dari internet** (localhost tidak bisa dijangkau Midtrans)
3. **Firewall memblokir request dari Midtrans**

## Solusi

### 1. Konfigurasi Webhook di Midtrans Dashboard

#### Untuk Sandbox (Testing):
1. Login ke https://dashboard.sandbox.midtrans.com
2. Pilih **Settings** → **Configuration**
3. Di bagian **Payment Notification URL**, masukkan:
   ```
   https://your-domain.com/api/v1/webhooks/midtrans
   ```
4. **Save** konfigurasi

#### Untuk Production:
1. Login ke https://dashboard.midtrans.com
2. Pilih **Settings** → **Configuration**
3. Di bagian **Payment Notification URL**, masukkan:
   ```
   https://your-production-domain.com/api/v1/webhooks/midtrans
   ```
4. **Save** konfigurasi

### 2. Expose Localhost untuk Testing (Development)

Jika backend Anda berjalan di localhost, Midtrans tidak bisa mengakses webhook URL. Gunakan salah satu solusi berikut:

#### Opsi A: Menggunakan Ngrok
```bash
# Install ngrok (jika belum)
# Download dari https://ngrok.com/download

# Jalankan ngrok
ngrok http 3000

# Ngrok akan memberikan URL publik seperti:
# https://abc123.ngrok.io

# Gunakan URL ini di Midtrans:
# https://abc123.ngrok.io/api/v1/webhooks/midtrans
```

#### Opsi B: Menggunakan Cloudflare Tunnel
```bash
# Install cloudflared
# Download dari https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation

# Jalankan tunnel
cloudflared tunnel --url http://localhost:3000
```

#### Opsi C: Deploy Backend ke Server Cloud
Deploy backend Anda ke:
- Heroku
- Railway
- Render
- DigitalOcean
- AWS
- Google Cloud

### 3. Sync Manual (Temporary Solution)

Jika webhook belum bisa dikonfigurasi, gunakan script sync manual:

```bash
cd Backend
node scripts/sync-midtrans-status.js
```

Script ini akan:
- ✅ Mengecek semua enrollment dengan status `pending`
- ✅ Query status transaksi ke Midtrans API
- ✅ Update status enrollment berdasarkan status di Midtrans
- ✅ Menampilkan summary hasil sync

### 4. Verifikasi Webhook

Setelah konfigurasi webhook, test dengan:

1. **Beli kelas baru** dari frontend
2. **Bayar melalui Midtrans** (gunakan test payment di sandbox)
3. **Cek log backend**, harusnya muncul:
   ```
   [Webhook] Order ID: LENTERA-TRX-XXXXXX, Status: settlement, Fraud: accept
   [Webhook] ✅ Enrollment BARU dibuat untuk user: LT-XXXXXX
   ```
4. **Refresh dashboard** - Kelas harusnya langsung muncul

## Endpoint Webhook

Backend sudah menyediakan endpoint webhook di:
```
POST /api/v1/webhooks/midtrans
```

Endpoint ini:
- ✅ Tidak memerlukan autentikasi (dipanggil oleh Midtrans server)
- ✅ Memverifikasi signature dari Midtrans
- ✅ Mengupdate status enrollment secara otomatis
- ✅ Mendukung semua status transaksi: settlement, pending, expire, cancel, deny

## Testing Webhook di Local

Gunakan Postman atau cURL untuk test webhook secara manual:

```bash
curl -X POST http://localhost:3000/api/v1/webhooks/midtrans \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "LENTERA-TRX-657383",
    "transaction_status": "settlement",
    "fraud_status": "accept",
    "metadata": {
      "user_id": "LT-512402",
      "learning_path_id": "LP-000007"
    }
  }'
```

## Troubleshooting

### Kelas Tidak Muncul di Dashboard Setelah Bayar

1. **Cek status di Midtrans Dashboard**
   - Login ke dashboard Midtrans
   - Cek apakah transaksi sudah settlement

2. **Cek status enrollment di database**
   ```bash
   cd Backend
   node -e "const db = require('./models'); db.sequelize.query('SELECT * FROM UserEnrollments WHERE midtrans_transaction_id = \"LENTERA-TRX-XXXXXX\"', { type: db.Sequelize.QueryTypes.SELECT }).then(console.log);"
   ```

3. **Jika status masih pending**, jalankan sync script:
   ```bash
   node scripts/sync-midtrans-status.js
   ```

4. **Cek log backend** untuk error webhook

### Webhook Tidak Pernah Dipanggil

- ✅ Pastikan URL webhook sudah dikonfigurasi di Midtrans Dashboard
- ✅ Pastikan backend bisa diakses dari internet (bukan localhost)
- ✅ Cek firewall/security group jika deploy di cloud
- ✅ Gunakan ngrok/cloudflare tunnel untuk testing di local

## Monitoring

Untuk memonitor webhook yang masuk, tambahkan log di backend:

```javascript
// Di webhookController.js
console.log('[Webhook] Received notification:', JSON.stringify(notificationBody, null, 2));
```

Log ini akan membantu debug jika ada masalah dengan webhook.

## Important Notes

⚠️ **Jangan expose localhost ke internet untuk production!**
- Ngrok/Cloudflare Tunnel hanya untuk development/testing
- Untuk production, deploy backend ke server dengan SSL/HTTPS

⚠️ **Jangan commit Midtrans credentials ke Git!**
- Simpan di `.env` file
- Tambahkan `.env` ke `.gitignore`

⚠️ **Test dengan Sandbox dulu sebelum Production**
- Gunakan sandbox keys untuk development
- Switch ke production keys setelah testing berhasil
