import { NextResponse } from "next/server";
import OpenAI from "openai";

const systemPrompt = "This is a prompt for the OpenAI API.";

export async function POST(req) {
    // Initialize the OpenAI client with your API key
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY, // Ensure your API key is set in environment variables
    });

    const data = await req.json();

    // Create a completion request with streaming enabled
    const completion = await openai.chat.completions.create({
        messages: [
            {
                role: 'system',
                content: systemPrompt,
            },
            ...data,
        ],
        model: 'gpt-4', // Make sure this is the correct model name
        stream: true,
    });

    // Stream the response back to the client
    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            try {
                for await (const chunk of completion) {
                    const content = chunk.choices[0].delta?.content;
                    if (content) {
                        const text = encoder.encode(content);
                        controller.enqueue(text);
                    }
                }
            } catch (err) {
                console.error("Error in stream:", err);
                controller.close();
            }
        },
    });

    return new NextResponse(stream);
}
