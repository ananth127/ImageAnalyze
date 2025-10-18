import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" })); // to accept base64 image

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// System prompt
const systemPrompt = `!!!Important: Give all responses only in JSON format, even if it is a single character!!!

If the input belongs to any of these categories:
Analytical Ability and Problem Solving,
Numerical Ability,
Grammar and Vocabulary,
Reading Comprehension,
Writing Skills,
Coding,
Power Coding,
Technical Skills,
Data Structures,
OOPS Concepts,
Operating System General Concepts,
MySQL - Basics,
MySQL - Joins,
ANSI SQL, SQL Joins,
MySQL - Subqueries,
Pseudo Code - Basic Programming,
Pseudocode - Recursion,

follow these response rules:

1️⃣ If the input contains **MCQs (Multiple Choice Questions)** — automatically detect how many questions (n) are present and respond for **all** in a single JSON array. Each object must contain the question and the correct answer (with its option letter):
{
  "questions": [
    {
      "question": "Question 1 text here.",
      "options": ["Option A", "Option B",..., "Option H"],
      "answer": "Option A - Correct answer text here."
    },
    {
      "question": "Question 2 text here.",
      "options": ["Option A", "Option B",..., "Option H"],
      "answer": "Option D - Correct answer text here."
    },
    ...
    {
      "question": "Question n text here.",
      "options": ["Option A", "Option B",..., "Option H"],
      "answer": "Option B - Correct answer text here."
    }
  ],
  "definition": "give the response"
}

2️⃣ If the input is related to speech , repeat the same speech in text format and respond with:{
  "content": "give the response for the writing skills",
  "definition": "give the response"
}

3️⃣ If the input is a **simple statement, theory, or conceptual query**, respond with If the content is short, provide a deeper explanation about that topic; else give a two-line simple explanation.:
{
  "problemstatement": "give Entire problem statement, input,output,and expected behavior here.",
  "question": "give Entire problem statement, input,output,format of input and expected behavior here.",
  "content": "give the response for the statement or theory",
  "definition": "give the response"
}

4️⃣ If the input is **programming-related**, respond with:
{
  "problemstatement": "give Entire problem statement here.",
  "question": "Question or task extracted from the problem statement.",
  "definition": "Two-line simple explanation of the code.",
  "code": "<optimized and complete code solution here, without comment lines>"
}

5️⃣ If the input code has **incorrect logic**, debug and provide the corrected version:
{
  "problemstatement": "give Entire problem statement here.",
  "question": "Question or task extracted from the problem statement.",
  "definition": "Two-line simple explanation of the corrected code.",
  "code": "If the code contains double quotes, escape them with a backslash (\"). <corrected and optimized code solution here, without comment lines>"
}

6️⃣ If the input does **not** match any of the above categories, respond with:
{
  "content": "There is no input provided.",
  "definition": "Brief overview of the topic."
}

7️⃣ If no input is detected, respond with:
{
  "content": "I'm sorry, I didn't get any input.",
  "definition": "Brief overview of the topic."
}

8️⃣ Else:
{
  "content": "I'm sorry, Try again."
}
`;

app.post("/analyze-image", async (req, res) => {
  try {
    console.log("Received request to /analyze-image");
    const { imageBase64, mimeType } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "No image data received." });
    }

    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType || "image/png",
      },
    };

    const result = await model.generateContent([systemPrompt, imagePart]);
    const response = result.response;
    let rawText = response.text();

    // Clean markdown fences like ```json ```
    rawText = rawText.replace(/```json|```/g, "").trim();

    // Try to parse JSON safely
    let parsed;
    try {
      parsed = JSON.parse(rawText);
      console.log("Parsed JSON response:", parsed);
    } catch {
      parsed = { text: rawText };
    }

    res.json(parsed);
  } catch (error) {
    console.error("Error analyzing image:", error);
    res.status(500).json({ error: "Failed to analyze image." });
  }
});
const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>
  console.log(`✅ Server running at http://localhost:${PORT}`)
);
