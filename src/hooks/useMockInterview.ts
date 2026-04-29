import { generateGeminiResponse } from "../integrations/gemini";
import { speakText } from "../integrations/azureTts";
import { transcribeAudio, getTranscriptText } from "../integrations/assembly";

export async function runMockInterviewFlow(fileUrl: string) {
  // 1) Send audio URL to AssemblyAI to create a transcript and get its ID
  const transcriptId = await transcribeAudio(fileUrl);

  // 2) Retrieve transcript text
  const text = await getTranscriptText(transcriptId);

  // 3) Generate feedback via Gemini
  const prompt = `You are a helpful speaking coach. Give concise actionable feedback on the following response and suggestions to improve: "${text}"`;
  const feedback = await generateGeminiResponse(prompt);

  // 4) Optionally speak out the feedback
  await speakText(feedback);

  // 5) Return for UI consumption
  return { transcript: text, feedback };
}
