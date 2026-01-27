// File: Backend/src/controllers/assistantController.js
/**
 * @fileoverview Controller untuk AI Assistant endpoint
 * Menangani request dari mobile app dan web
 */

const assistantService = require('../services/assistantService');

/**
 * Handle POST request untuk AI Assistant
 * Mendukung streaming dan non-streaming response
 * 
 * Request body:
 * - message: string (required) - Pesan dari user
 * - messages: array (optional) - Array pesan untuk context (tidak disimpan)
 * - model: string (optional) - Model yang digunakan
 * - stream: boolean (optional, default: false) - Apakah streaming
 * 
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
async function handleAssistant(req, res) {
    console.log('🤖 [Assistant] POST /api/v1/assistant received');
    console.log('🤖 [Assistant] Request body:', JSON.stringify(req.body).substring(0, 200));
    
    try {
        const { messages, prompt, message, model, stream = false } = req.body;

        // Tentukan finalPrompt dari berbagai sumber
        let finalPrompt = (message ?? prompt ?? '').trim();
        
        // Jika tidak ada message/prompt, ambil dari array messages
        if (!finalPrompt && Array.isArray(messages) && messages.length > 0) {
            const lastUser = [...messages].reverse().find(m => m.role === 'user');
            finalPrompt = (lastUser?.content ?? '').trim();
        }

        if (!finalPrompt) {
            return res.status(400).json({
                success: false,
                error: 'Berikan pesan untuk dijawab'
            });
        }

        console.log('Assistant request:', { 
            messageLength: finalPrompt.length, 
            model, 
            stream 
        });

        // Non-streaming response
        if (!stream) {
            const result = await assistantService.generateResponse({
                message: finalPrompt,
                model,
                stream: false
            });

            // Return plain text untuk konsistensi dengan route.ts
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            return res.send(result.text);
        }

        // Streaming response
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('X-Accel-Buffering', 'no');
        res.setHeader('Transfer-Encoding', 'chunked');

        const result = await assistantService.generateResponse({
            message: finalPrompt,
            model,
            stream: true
        });

        // Stream chunks ke client
        for await (const chunk of result.stream) {
            try {
                if (!chunk) continue;
                const text = chunk.text();
                if (!text || text.trim() === '') continue;
                
                res.write(text);
            } catch (chunkError) {
                console.warn('Chunk processing error (skipping):', chunkError.message);
                continue;
            }
        }

        res.end();

    } catch (err) {
        console.error('Assistant controller error:', err);

        // Check specific error types
        const errorMessage = err.message || '';
        
        if (errorMessage.includes('quota') || errorMessage.includes('429') || errorMessage.includes('Kuota')) {
            return res.status(429).json({
                success: false,
                error: 'Kuota API habis',
                details: errorMessage
            });
        }

        if (errorMessage.includes('GEMINI_API_KEY')) {
            return res.status(500).json({
                success: false,
                error: 'Konfigurasi server tidak valid',
                details: 'API key tidak dikonfigurasi'
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Terjadi kesalahan pada server',
            details: errorMessage
        });
    }
}

/**
 * Handle GET request untuk health check
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
function healthCheck(req, res) {
    return res.json({
        success: true,
        status: 'ok',
        message: 'Lentera Karir AI Assistant API'
    });
}

module.exports = {
    handleAssistant,
    healthCheck
};
