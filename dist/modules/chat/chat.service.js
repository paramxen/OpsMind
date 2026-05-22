import OpenAI from 'openai';
import { getConfig } from '../../core/config/index.js';
import { getLogger } from '../../core/logger/index.js';
import { ExternalServiceError } from '../../core/errors/index.js';
import { getRelevantContext } from '../retrieval/retrieval.service.js';
const logger = getLogger();
const config = getConfig();
const client = new OpenAI({
    apiKey: config.OPENAI_API_KEY,
    baseURL: config.OPENAI_API_BASE,
});
const SYSTEM_PROMPT = `You are OpsMind AI, an enterprise-grade AI assistant for Standard Operating Procedures (SOPs).

Your role:
- Answer questions about SOPs with precision and accuracy
- ALWAYS ground your answers in the provided context
- NEVER fabricate information or hallucinate
- Cite your sources explicitly
- Acknowledge limitations and uncertainties

Guidelines:
1. If the answer is not in the provided context, say "I don't have information about that in the provided documents"
2. Always cite the source documents
3. Be concise but thorough
4. Maintain professional tone
5. For ambiguous questions, ask for clarification
6. If information is incomplete, state what is missing

Context will be provided in the following format:
[Document Name] Content excerpt

When referencing information, always mention the source document.`;
export const generateChatResponse = async (userMessage, documentIds, conversationHistory = []) => {
    try {
        // Retrieve relevant context
        const { context, results } = await getRelevantContext(userMessage, documentIds, 3000, 5);
        if (!context || context.trim().length === 0) {
            return {
                message: "I don't have any relevant information in the provided documents to answer that question.",
                citations: [],
            };
        }
        // Build messages for LLM
        const messages = [
            {
                role: 'system',
                content: `${SYSTEM_PROMPT}\n\nRELEVANT DOCUMENTS:\n${context}`,
            },
            ...conversationHistory.map((msg) => ({
                role: msg.role,
                content: msg.content,
            })),
            {
                role: 'user',
                content: userMessage,
            },
        ];
        const startTime = Date.now();
        // Call OpenAI
        const response = await client.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages,
            temperature: 0.3,
            max_tokens: 1500,
            top_p: 0.95,
        });
        const responseTime = Date.now() - startTime;
        if (!response.choices[0]?.message?.content) {
            throw new Error('No content in LLM response');
        }
        const message = response.choices[0].message.content;
        // Extract citations from retrieval results
        const citations = results.map((result) => ({
            documentId: result.documentId,
            documentName: result.documentName,
            chunkId: result.chunkId,
            pageNumber: result.pageNumber,
            relevanceScore: result.relevanceScore,
            text: result.text.substring(0, 200), // First 200 chars
        }));
        logger.info({
            userMessageLength: userMessage.length,
            responseLength: message.length,
            citationCount: citations.length,
            responseTime,
        }, 'Chat response generated');
        return {
            message,
            citations,
            metadata: {
                tokensUsed: response.usage?.total_tokens,
                responseTime,
            },
        };
    }
    catch (error) {
        logger.error({ err: error, userMessage }, 'Failed to generate chat response');
        throw new ExternalServiceError('OpenAI', error.message, 'CHAT_GENERATION_FAILED');
    }
};
export const streamChatResponse = async (userMessage, documentIds, onChunk, conversationHistory = []) => {
    try {
        // Retrieve relevant context
        const { context, results } = await getRelevantContext(userMessage, documentIds, 3000, 5);
        if (!context || context.trim().length === 0) {
            const message = "I don't have any relevant information in the provided documents to answer that question.";
            onChunk(message);
            return {
                message,
                citations: [],
            };
        }
        // Build messages for LLM
        const messages = [
            {
                role: 'system',
                content: `${SYSTEM_PROMPT}\n\nRELEVANT DOCUMENTS:\n${context}`,
            },
            ...conversationHistory.map((msg) => ({
                role: msg.role,
                content: msg.content,
            })),
            {
                role: 'user',
                content: userMessage,
            },
        ];
        let fullMessage = '';
        // Stream from OpenAI
        const stream = await client.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages,
            temperature: 0.3,
            max_tokens: 1500,
            top_p: 0.95,
            stream: true,
        });
        for await (const event of stream) {
            const chunk = event.choices[0]?.delta?.content || '';
            if (chunk) {
                fullMessage += chunk;
                onChunk(chunk);
            }
        }
        // Extract citations from retrieval results
        const citations = results.map((result) => ({
            documentId: result.documentId,
            documentName: result.documentName,
            chunkId: result.chunkId,
            pageNumber: result.pageNumber,
            relevanceScore: result.relevanceScore,
            text: result.text.substring(0, 200),
        }));
        logger.info({
            userMessageLength: userMessage.length,
            responseLength: fullMessage.length,
            citationCount: citations.length,
        }, 'Streaming chat response completed');
        return {
            message: fullMessage,
            citations,
        };
    }
    catch (error) {
        logger.error({ err: error, userMessage }, 'Failed to stream chat response');
        throw new ExternalServiceError('OpenAI', error.message, 'CHAT_STREAMING_FAILED');
    }
};
//# sourceMappingURL=chat.service.js.map