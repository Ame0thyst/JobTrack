import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { resumeContent, jobDescription, applicationId, forceRefresh = false } = await request.json();
    if (!resumeContent || !jobDescription || !applicationId) {
      return NextResponse.json({ message: 'Missing required parameters' }, { status: 400 });
    }

    // 1. If not forcing a refresh, check if cached analysis exists in database
    if (!forceRefresh) {
      const application = await prisma.jobApplication.findUnique({
        where: { id: applicationId },
        select: { aiMatchAnalysis: true }
      });

      if (application?.aiMatchAnalysis) {
        try {
          const cachedAnalysis = JSON.parse(application.aiMatchAnalysis);
          console.log(`Cache Hit for AI Match: ${applicationId}`);
          return NextResponse.json({ analysis: cachedAnalysis, cached: true }, { status: 200 });
        } catch (e) {
          console.error('Failed to parse cached AI analysis, re-running:', e);
        }
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ message: 'Gemini API key is not configured on the server. Please add GEMINI_API_KEY to your .env file.' }, { status: 500 });
    }

    const prompt = `You are a Senior Technical Recruiter and ATS Optimization Expert. Analyze the compatibility of the candidate's resume with the job description.
Return a structured JSON object conforming exactly to this JSON schema:
{
  "score": number (0 to 100),
  "matchingSkills": ["string"],
  "missingSkills": ["string"],
  "suggestions": ["string"]
}

Important Analysis Guidelines:
1. "score": Be realistic but encouraging. Base it on overlapping skills, experience levels, and technology stack.
2. "matchingSkills": List keywords, technologies, methodologies, or soft skills present in both the resume and the job description.
3. "missingSkills": List crucial technologies, tools, or requirements mentioned in the job description that are NOT found in the resume.
4. "suggestions": Provide 3-5 clear, highly actionable bullet points on how the candidate can customize this resume (e.g. "Highlight experience with Docker in your first role", "Add Redis to your skills section", etc.) to pass the ATS screening.

Resume Content:
\"\"\"
${resumeContent}
\"\"\"

Job Description:
\"\"\"
${jobDescription}
\"\"\"`;

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
            temperature: 0.2,
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
    
    const candidateText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      console.error('Empty response from Gemini:', result);
      return NextResponse.json({ message: 'Invalid response from AI model' }, { status: 502 });
    }

    const matchAnalysis = JSON.parse(candidateText.trim());

    // 2. Cache result inside the database
    await prisma.jobApplication.update({
      where: { id: applicationId },
      data: {
        aiMatchAnalysis: JSON.stringify(matchAnalysis)
      }
    });

    return NextResponse.json({ analysis: matchAnalysis, cached: false }, { status: 200 });
  } catch (error) {
    console.error('AI match analysis route error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
