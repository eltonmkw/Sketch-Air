import { GoogleGenAI } from "@google/genai";
import { ArtStyle } from "../types";
import { STYLE_PROMPTS } from "../constants";

export async function testApiKey(apiKey: string): Promise<void> {
  const ai = new GoogleGenAI({ apiKey, httpOptions: { timeout: 15000 } });
  try {
    await ai.models.get({ model: 'gemini-2.5-flash-image' });
  } catch (error) {
    const status = (error as { status?: number })?.status;
    if (status === 400 || status === 401) {
      throw new Error('Google rejected this key. Check that you copied a valid Gemini API key.');
    }
    if (status === 403) {
      throw new Error('Access denied. Check the key’s API and website restrictions and Gemini API access.');
    }
    if (status === 429) {
      throw new Error('Google is rate limiting this request. Try again shortly.');
    }
    throw new Error('Connection test failed. Check your connection, API access, and browser restrictions, then try again.');
  }
}

/**
 * Generates an image based on a sketch (base64) and a prompt/style.
 */
export const generateImageFromSketch = async (
  base64Image: string,
  userPrompt: string,
  style: ArtStyle,
  apiKey: string
): Promise<string> => {
  try {
    if (!apiKey) {
      throw new Error("Add your Gemini API key using the API key button to generate artwork.");
    }
    const ai = new GoogleGenAI({ apiKey });
    const stylePrompt = STYLE_PROMPTS[style];
    
    // Clean the base64 string to get just the data
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

    const finalPrompt = `
      [System: Image Generation Mode]
      Task: Generate a high-fidelity image based on a rough user sketch and a text description.
      
      USER DESCRIPTION: "${userPrompt || "A creative masterpiece"}"
      STYLE: "${style}" (${stylePrompt})
      
      CRITICAL INSTRUCTIONS:
      1. PRIORITY: The USER DESCRIPTION is the absolute authority for the object's identity. 
         - If the text says "Beach Ball", generate a Beach Ball, even if the sketch is a squiggly mess.
         - If the text says "Cat", generate a Cat, even if the sketch looks like a rock.
      2. ROLE OF SKETCH: Use the input sketch ONLY as a loose guide for composition (where the object is placed) and rough size. Do NOT strictly adhere to the messy lines of the sketch.
      3. OUTPUT: Transform the rough doodle into a polished, professional ${style} image.
      
      Strictly output the image. Do not provide a text description.
    `;

    // Using gemini-2.5-flash-image for speed and efficiency
    const model = 'gemini-2.5-flash-image';

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: cleanBase64,
            },
          },
          {
            text: finalPrompt,
          },
        ],
      },
    });

    // Extract image from response
    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    
    // Check for text response to give better error feedback
    const textPart = response.candidates?.[0]?.content?.parts?.find(p => p.text);
    if (textPart) {
      console.warn("Gemini returned text:", textPart.text);
      const errorText = textPart.text.length > 200 ? textPart.text.slice(0, 200) + "..." : textPart.text;
      throw new Error(`Model responded with text: "${errorText}"`);
    }

    throw new Error("No image generated. Please try again with a clearer sketch.");

  } catch (error) {
    throw error;
  }
};
