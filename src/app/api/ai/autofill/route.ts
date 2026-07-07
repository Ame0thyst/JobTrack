import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { text } = await request.json();
    if (!text || text.trim() === '') {
      return NextResponse.json({ message: 'Job description text is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ message: 'Gemini API key is not configured on the server. Please add GEMINI_API_KEY to your .env file.' }, { status: 500 });
    }

    const prompt = `You are an expert ATS (Applicant Tracking System) assistant. Extract job application metadata from the following job description text.
Return a JSON object conforming exactly to this JSON schema:
{
  "companyName": "string or null",
  "roleTitle": "string or null",
  "jobType": "FULL_TIME" | "INTERNSHIP" | "FREELANCE" | "CONTRACT" | "OTHER",
  "location": "string or null (e.g. Remote, City, Country)",
  "sourcePlatform": "LINKEDIN" | "INDEED" | "UPWORK" | "REFERRAL" | "COMPANY_WEBSITE" | "OTHER",
  "salaryMin": "number or null",
  "salaryMax": "number or null",
  "salaryCurrency": "IDR" | "USD" | "EUR" | "SGD" | "GBP",
  "benefits": "string or null",
  "companyIndustry": "string or null",
  "companyDescription": "string or null"
}

Important Rules:
1. Ensure the enums for jobType and sourcePlatform match exactly. Default to OTHER if unclear.
2. If salary is in monthly/hourly or hourly rate, estimate or scale it to monthly base figures, or input the raw numerical value. If currency is not found, default to IDR.
3. Keep benefits description short and concise.
4. Try your best to extract companyName and roleTitle. If completely missing, return null.

Job description text:
"""
${text}
"""`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API call failed:', errorData);
      return NextResponse.json({ message: 'Failed to communicate with AI service' }, { status: 502 });
    }

    const result = await response.json();
    
    // Validate output structure
    const candidateText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      console.error('Empty response from Gemini:', result);
      return NextResponse.json({ message: 'Invalid response from AI model' }, { status: 502 });
    }

    // Parse JSON response from Gemini
    const extractedData = JSON.parse(candidateText.trim());

    return NextResponse.json({ data: extractedData }, { status: 200 });
  } catch (error) {
    console.error('AI autofill route error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
