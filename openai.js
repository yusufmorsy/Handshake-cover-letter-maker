/* Helper that wraps the OpenAI Chat API */
export async function generateCoverLetter({ job, resume, apiKey }) {
  if (!apiKey) throw new Error("Missing OpenAI API key – set it in the extension options.");

  const systemPrompt = `You are an expert career coach. Write a concise, engaging cover letter. Limit to one page.`;
  const userPrompt = `Job Description:\n${job.description}\n\nMy Resume:\n${resume}\n\nWrite a cover letter addressed to the hiring manager at ${job.company} for the role '${job.title}'.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7
    })
  });

  if (!response.ok) throw new Error(`OpenAI error: ${response.status}`);
  const data = await response.json();
  return data.choices[0].message.content.trim();
}