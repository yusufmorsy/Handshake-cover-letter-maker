/* utils/openai.js
 * Helper that wraps the OpenAI Chat-Completion API
 * 
 * Supports an optional `template` (additional user instructions)
 * which will be appended to the core prompt if provided.
 */

export async function generateCoverLetter({
  job,
  resume,
  apiKey,
  user = {},
  template = ""
}) {
  if (!apiKey) {
    throw new Error("Missing OpenAI API key – set it in the extension options.");
  }

  /* ---------- graceful defaults ---------- */
  const safeUser = {
    name:      (user.name      || "Your Name").trim(),
    cityState: (user.cityState || "Your City, ST").trim(),
    phone:     (user.phone     || "(000) 000-0000").trim(),
    email:     (user.email     || "you@example.com").trim()
  };

  const safeResume = (resume ?? "").trim() || "(No resume text supplied)";

  /* ---------- date header ---------- */
  const today = new Date().toLocaleDateString("en-US", {
    year:  "numeric",
    month: "long",
    day:   "numeric"
  });

  /* ---------- headers to show in the letter ---------- */
  const userHeader = `${safeUser.name}
${safeUser.cityState} | ${safeUser.phone} | ${safeUser.email}`;

  const managerHeader = `${job.hiringManager ?? "Hiring Manager"}
${job.hiringTitle   ?? ""} 
${job.company}
${job.companyAddress ?? ""}`;

  /* ---------- core prompts ---------- */
  const systemPrompt = `
You are an expert career coach and professional cover-letter writer.
Produce a concise, one-page cover letter with this exact structure:

1. Applicant header (already provided) – do NOT modify.
2. Blank line.
3. Today’s date (“${today}”).
4. Blank line.
5. Hiring-manager header (already provided) – fill blanks gracefully.
6. Blank line.
7. Body (3–4 concise paragraphs).
8. Blank line.
9. “Sincerely,” + applicant’s name (no contact info after sign-off).
`.trim();

  let userPrompt = `
### Applicant Header (render exactly):
${userHeader}

### Hiring-Manager Header (fill missing parts if blank):
${managerHeader}

### Job Description:
${job.description}

### Applicant Resume:
${safeResume}

Write the letter to apply for the “${job.title}” role in a confident, professional tone.
Keep it under one page (~350 words).
`.trim();

  /* ---------- append user’s extra instructions, if any ---------- */
  if (template.trim()) {
    userPrompt += `

### Additional instructions (from settings):
${template.trim()}`;
  }

  /* ---------- call OpenAI API ---------- */
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model:       "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt   }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}
