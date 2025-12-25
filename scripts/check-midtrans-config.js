#!/usr/bin/env node
/**
 * Script untuk mengecek dan validasi konfigurasi Midtrans
 * Jalankan: node scripts/check-midtrans-config.js
 */

require('dotenv').config();

console.log('\n========== MIDTRANS CONFIGURATION CHECK ==========\n');

const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
const clientKey = process.env.MIDTRANS_CLIENT_KEY || '';
const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

console.log('Status Konfigurasi:');
console.log('-------------------');

// Check Server Key
if (!serverKey) {
  console.log('❌ MIDTRANS_SERVER_KEY: NOT SET');
  console.log('   ⚠️  Checkout dan webhook akan gagal!');
} else if (serverKey.includes('SB-Mid-server-')) {
  console.log(`✅ MIDTRANS_SERVER_KEY: SET (Sandbox)`);
  console.log(`   Value: ${serverKey.substring(0, 25)}...`);
} else if (serverKey.includes('Mid-server-')) {
  console.log(`✅ MIDTRANS_SERVER_KEY: SET (Production)`);
  console.log(`   Value: ${serverKey.substring(0, 25)}...`);
} else {
  console.log(`⚠️  MIDTRANS_SERVER_KEY: SET (Format unknown)`);
  console.log(`   Value: ${serverKey.substring(0, 25)}...`);
}

// Check Client Key
if (!clientKey) {
  console.log('❌ MIDTRANS_CLIENT_KEY: NOT SET');
} else if (clientKey.includes('SB-Mid-client-')) {
  console.log(`✅ MIDTRANS_CLIENT_KEY: SET (Sandbox)`);
} else if (clientKey.includes('Mid-client-')) {
  console.log(`✅ MIDTRANS_CLIENT_KEY: SET (Production)`);
} else {
  console.log(`⚠️  MIDTRANS_CLIENT_KEY: SET (Format unknown)`);
}

// Check Environment Match
console.log(`\nEnvironment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT (Sandbox)'}`);

if (serverKey) {
  const isSandboxKey = serverKey.includes('SB-Mid-server-');
  const isProductionKey = serverKey.includes('Mid-server-') && !serverKey.includes('SB-Mid-server-');
  
  if (isSandboxKey && isProduction) {
    console.log('⚠️  MISMATCH: Using Sandbox key dengan MIDTRANS_IS_PRODUCTION=true');
    console.log('   → Set MIDTRANS_IS_PRODUCTION=false untuk development');
  } else if (isProductionKey && !isProduction) {
    console.log('⚠️  MISMATCH: Using Production key dengan MIDTRANS_IS_PRODUCTION=false');
    console.log('   → Set MIDTRANS_IS_PRODUCTION=true untuk production');
  } else if (isSandboxKey && !isProduction) {
    console.log('✅ Konfigurasi Match: Sandbox key + Development mode');
  } else if (isProductionKey && isProduction) {
    console.log('✅ Konfigurasi Match: Production key + Production mode');
  }
}

console.log('\n========== RECOMMENDATIONS ==========\n');

if (!serverKey || !clientKey) {
  console.log('1️⃣  Dapatkan kunci dari https://dashboard.midtrans.com/settings/config');
  console.log('2️⃣  Pilih Environment: Sandbox (untuk testing) atau Production');
  console.log('3️⃣  Copy Server Key dan Client Key');
  console.log('4️⃣  Update .env file di project root');
  console.log('5️⃣  Restart server (node .)');
} else {
  console.log('✅ Konfigurasi terlihat OK!');
  console.log('📝 Langkah selanjutnya:');
  console.log('   1. Restart server: node .');
  console.log('   2. Test checkout dengan curl atau Postman');
  console.log('   3. Check konsol server untuk debug messages');
}

console.log('\n==================================================\n');