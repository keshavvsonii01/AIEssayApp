import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

interface GenerateRequestBody {
  keywords: string;
}

export async function POST(request: NextRequest) {
  // Check if request was aborted
  const controller = new AbortController();
  const signal = controller.signal;

  // Set a timeout to prevent indefinite generation
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const { keywords } = await request.json() as GenerateRequestBody;

    // Initialize the Gemini API client
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Enhanced prompt with academic tone
    const prompt = `Write a comprehensive, scholarly essay about ${keywords}. 
    Provide an in-depth analysis with:
    - Clear, academic language
    - Substantive historical or contextual information
    - Objective analysis
    - Detailed exploration of the topic
    Aim for 350-450 words, include potential source references within the text.`;

    // Generate content with signal for abort
    const result = await model.generateContent(prompt, { signal });
    const response = await result.response;
    const text = response.text();

    // Clear timeout
    clearTimeout(timeoutId);

    return NextResponse.json({ 
      content: text,
      references: [
        `Academic Research on ${keywords}, Global Studies Journal, 2024`,
        `Comprehensive ${keywords} Analysis, International Review, 2024`
      ]
    }, { status: 200 });
  } catch (error) {
    // Clear timeout in case of error
    clearTimeout(timeoutId);

    // Check if error is an abort error
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Content generation was interrupted' }, 
        { status: 499 }  // Client Closed Request
      );
    }

    console.error('Content generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' }, 
      { status: 500 }
    );
  }
}