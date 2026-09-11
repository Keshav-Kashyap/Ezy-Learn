const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'openai/gpt-oss-120b';
const GROQ_TIMEOUT_MS = 45000;

const SYSTEM_PROMPT = `You are a helpful AI assistant for EzyStudy, an educational platform.

ATTACHMENT RULES:
- If extracted file text is included, treat it as actual file content.
- Never say "I cannot read/view PDF or image" when extracted file text is present.
- Answer using user query + extracted file text together.
- If the user prompt includes "Extracted text from attached files:", you must use that extracted content directly and must not refuse by saying you cannot access the file.

IMPORTANT: Format your response using Markdown with:
- **bold** for important terms
- # Headings for main points
- Bullet points (- or *) for lists
- Code blocks (wrap with \`\`\`language) for code examples
- Emojis (📚✨🔥) to make content engaging
- Line breaks between sections for readability`;

export async function callGroqChat({ message, context, history, apiKey }) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

    try {
        const safeHistory = Array.isArray(history) ? history : [];
        const hasExtractedSection = typeof message === 'string' && message.includes('Extracted text from attached files:');

        console.info('[gpt-chat][groq] request', {
            model: GROQ_MODEL,
            contextChars: (context || '').length,
            historyCount: safeHistory.length,
            messageChars: (message || '').length,
            hasExtractedSection,
        });

        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            signal: controller.signal,
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: `${SYSTEM_PROMPT}\n\nContext: ${context || 'N/A'}`,
                    },
                    ...safeHistory.map((msg) => ({
                        role: msg.role,
                        content: msg.content,
                    })),
                    {
                        role: 'user',
                        content: message,
                    },
                ],
                temperature: 0.7,
                max_tokens: 1024,
                top_p: 1,
                stream: false,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[gpt-chat][groq] upstream-error', {
                status: response.status,
                errorText,
            });
            throw new Error(`Groq API error: ${errorText}`);
        }

        const data = await response.json();
        const reply = data?.choices?.[0]?.message?.content || '';

        console.info('[gpt-chat][groq] response', {
            replyChars: reply.length,
        });

        return reply;
    } finally {
        clearTimeout(timeoutId);
    }
}
