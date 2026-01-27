// File: Backend/src/services/assistantService.js
/**
 * @fileoverview Service untuk AI Assistant menggunakan Google Generative AI (Gemini)
 * Logic sama dengan route.ts di frontend web
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

const DEFAULT_MODEL = 'gemini-flash-latest';
const MODEL_FALLBACKS = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash',
];

/**
 * System context untuk Asisten Lentera
 * Sama persis dengan versi web untuk konsistensi
 */
const SYSTEM_CONTEXT = `Kamu adalah "Asisten Lentera", asisten AI untuk platform Lentera Karir. Gunakan bahasa Indonesia yang natural dan ramah.

TENTANG LENTERA KARIR:
Platform pengembangan karir dengan kursus online, mentorship, learning paths, dan job board untuk berbagai bidang seperti Web Development, Data Science, UI/UX Design, Digital Marketing, dan soft skills.

Lentera Karir adalah salah satu produk unggulan dari Software House Padang - PT. Metro Indonesian Software, perusahaan yang berfokus pada jasa pembuatan website, company profile, dan aplikasi mobile. Jika user menanyakan siapa pembuat atau pengembang Lentera Karir, jelaskan ini dengan bangga dan natural.

CARA MENYELESAIKAN COURSE:
Untuk menyelesaikan sebuah course dan mendapatkan sertifikat, peserta WAJIB:
1. Menonton semua video pembelajaran sampai selesai
2. Mendownload dan membaca ebook materi yang disediakan
3. Mengerjakan dan lulus semua quiz yang ada di course tersebut

Jika ada yang bertanya tentang syarat menyelesaikan course atau cara dapat sertifikat, jelaskan ketiga syarat ini dengan jelas.

ATURAN KETAT - CARA MENULIS RESPONS:

1. DILARANG pakai simbol markdown:
   ❌ JANGAN: **bold**, *italic*, # heading, - list, 1. 2. 3. numbered list
   ✅ PAKAI: teks biasa tanpa format apapun

2. Untuk list atau poin-poin, tulis dengan paragraf terpisah atau pakai emoji (📚 🎯 💼)

3. Tulis dalam paragraf pendek maksimal 3-4 kalimat

4. Pakai baris kosong (enter 2x) untuk pemisah paragraf

5. Bahasa natural conversational: "banget", "kok", "nih", "dong", "sih"

6. Jawab langsung to-the-point, jangan bertele-tele

7. Akhiri dengan pertanyaan atau ajakan engage

CONTOH BENAR:

Q: "Gimana cara daftar kursus?"
A: "Gampang kok! Kamu bisa langsung explore kursus di platform, pilih yang sesuai minat, lalu klik tombol Daftar.

Setelah daftar, kamu bisa langsung mulai belajar dari video pertama. Progress belajarmu bakal kesimpen otomatis, jadi bisa lanjut kapan aja.

Kalau ada yang bingung saat belajar, kamu juga bisa tanya di forum diskusi atau konsultasi sama mentor loh!

Mau mulai belajar skill apa nih? 😊"

Q: "Perbedaan frontend dan backend?"
A: "Oke jadi gini bedanya:

Frontend itu yang kamu lihat dan klik di website. Tampilan, button, animasi, form isian. Pakai HTML, CSS, JavaScript. Cocok buat yang suka design dan visual.

Backend itu yang di belakang layar. Database, server, API, logic bisnis. Pakai Node.js, Python, PHP. Cocok buat yang suka problem solving dan data.

Fullstack bisa keduanya, makanya paling dicari di industri tapi ya butuh effort lebih buat belajar.

Kamu lebih tertarik yang mana? 🤔"

YANG HARUS DIHINDARI:
❌ Jangan pakai "pertama", "kedua", "ketiga" 
❌ Jangan pakai numbered list 1. 2. 3.
❌ Jangan pakai bullet points - atau *
❌ Jangan pakai **bold**
❌ Jangan terlalu formal`;

/**
 * Helper function untuk membuat array model unik
 * @param {Array} models - Array model names
 * @returns {Array} - Array model unik
 */
function uniqueModels(models) {
    const seen = new Set();
    const out = [];
    for (const m of models) {
        if (!m) continue;
        const v = m.trim();
        if (!v || seen.has(v)) continue;
        seen.add(v);
        out.push(v);
    }
    return out;
}

/**
 * Generate response dari AI Assistant
 * @param {Object} options - Options untuk generate
 * @param {string} options.message - Pesan dari user
 * @param {string} [options.model] - Model yang digunakan
 * @param {boolean} [options.stream] - Apakah streaming
 * @returns {Promise<Object>} - Response object dengan text atau stream
 */
async function generateResponse({ message, model = DEFAULT_MODEL, stream = false }) {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        throw new Error('GEMINI_API_KEY tidak dikonfigurasi dengan benar di server');
    }

    const finalPrompt = (message || '').trim();
    if (!finalPrompt) {
        throw new Error('Pesan tidak boleh kosong');
    }

    // Gabungkan system context dengan user prompt
    const fullPrompt = `${SYSTEM_CONTEXT}

Jawab pertanyaan user dengan gaya natural dan friendly seperti contoh di atas: "${finalPrompt}"`;

    console.log('✅ API key found, generating response for:', finalPrompt.substring(0, 50) + '...');

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelsToTry = uniqueModels([model, ...MODEL_FALLBACKS]);
    
    let geminiModel = null;
    let lastError = null;

    // Coba model satu per satu sampai berhasil
    for (const m of modelsToTry) {
        try {
            console.log(`Trying model: ${m}`);
            geminiModel = genAI.getGenerativeModel({ model: m });
            // Test model dengan generate sederhana untuk validasi
            break;
        } catch (e) {
            console.error(`Model ${m} failed:`, e.message);
            lastError = e;
            continue;
        }
    }

    if (!geminiModel) {
        throw new Error(lastError?.message || 'Tidak ada model yang kompatibel');
    }

    // Non-streaming response
    if (!stream) {
        try {
            const result = await geminiModel.generateContent(fullPrompt);
            const response = await result.response;
            const text = response.text();
            return { text: text || '(tidak ada respons)' };
        } catch (err) {
            console.error('Gemini API error:', err);
            
            // Check quota error
            const errorMessage = err.message || '';
            if (errorMessage.includes('quota') || errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
                throw new Error('Kuota API habis. Silakan coba lagi nanti.');
            }
            
            throw err;
        }
    }

    // Streaming response
    try {
        const result = await geminiModel.generateContentStream(fullPrompt);
        return { stream: result.stream };
    } catch (err) {
        console.error('Gemini streaming error:', err);
        
        const errorMessage = err.message || '';
        if (errorMessage.includes('quota') || errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
            throw new Error('Kuota API habis. Silakan coba lagi nanti.');
        }
        
        throw err;
    }
}

module.exports = {
    generateResponse,
    DEFAULT_MODEL,
    MODEL_FALLBACKS,
};
