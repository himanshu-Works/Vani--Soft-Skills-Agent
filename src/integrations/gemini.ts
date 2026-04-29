// Helper to list available models
async function getAvailableModels(apiKey: string): Promise<string[]> {
  try {
    const apiBase = import.meta.env.VITE_GEMINI_API_BASE || 'https://generativelanguage.googleapis.com';
    const url = `${apiBase}/v1/models?key=${apiKey}`;
    
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const models = data.models?.map((m: any) => {
        // Extract model name (remove 'models/' prefix if present)
        const name = m.name?.replace('models/', '') || m.name;
        return name;
      }).filter((name: string) => name && name.includes('gemini')) || [];
      return models;
    }
  } catch (error) {
    console.warn("Could not list available models:", error);
  }
  return [];
}

export async function generateGeminiResponse(prompt: string): Promise<string> {
  try {
    // Get and validate API key
    let apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error("Gemini API key is missing!");
      throw new Error("Gemini API key not configured. Please set VITE_GEMINI_API_KEY in your .env file.\n\nGet your API key from: https://makersuite.google.com/app/apikey");
    }
    
    // Trim whitespace and remove quotes if present
    apiKey = apiKey.trim().replace(/^["']|["']$/g, '');
    
    // Check if API key is a placeholder
    if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.startsWith('your_') || apiKey.length < 20) {
      throw new Error(
        "Gemini API key is not set correctly.\n\n" +
        "Please:\n" +
        "1. Open your .env file in the Vani-new-main directory\n" +
        "2. Replace 'your_gemini_api_key_here' with your actual API key\n" +
        "3. Get your API key from: https://makersuite.google.com/app/apikey\n" +
        "4. Restart your dev server after saving the .env file"
      );
    }
    
    // Basic format check (Gemini API keys usually start with AIza)
    if (!apiKey.startsWith('AIza') && apiKey.length < 30) {
      console.warn("API key format looks unusual. Make sure you copied the complete key.");
    }

    console.log("Sending request to Gemini API...");
    console.log("API Key present:", apiKey ? `${apiKey.substring(0, 10)}...` : "MISSING");

    const apiBase = import.meta.env.VITE_GEMINI_API_BASE || 'https://generativelanguage.googleapis.com';
    const customModel = import.meta.env.VITE_GEMINI_MODEL?.trim();
    
    // Try to get available models first
    let availableModels: string[] = [];
    try {
      console.log("Fetching available models...");
      availableModels = await getAvailableModels(apiKey);
      if (availableModels.length > 0) {
        console.log("Available models found:", availableModels);
      }
    } catch (error) {
      console.warn("Could not fetch model list, using defaults");
    }
    
    // Use available models if we got them, otherwise use defaults
    // Remove 'models/' prefix and filter for gemini models
    const defaultModels = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
    const modelsToTry = customModel 
      ? [customModel, ...(availableModels.length > 0 ? availableModels : defaultModels)]
      : (availableModels.length > 0 ? availableModels : defaultModels);
    
    // Remove duplicates and ensure we have models to try
    const uniqueModels = [...new Set(modelsToTry.filter(m => m))];
    if (uniqueModels.length === 0) {
      throw new Error("No Gemini models available. Please check your API key permissions.");
    }
    
    const errors: string[] = [];
    
    // Try v1 API first (more stable)
    for (const modelName of uniqueModels) {
      try {
        // Remove any 'models/' prefix if present
        const cleanModelName = modelName.replace(/^models\//, '');
        const url = `${apiBase}/v1/models/${cleanModelName}:generateContent?key=${apiKey}`;
        
        console.log(`[Gemini] Trying v1 API with model: ${cleanModelName}`);
        
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }]
          })
        });

        if (!res.ok) {
          const errorText = await res.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: { message: errorText } };
          }
          
          const errorMessage = errorData.error?.message || errorText;
          errors.push(`[v1/${cleanModelName}] ${res.status}: ${errorMessage}`);
          console.error(`Gemini API Error (v1/${cleanModelName}):`, res.status, errorMessage);
          
          // If 404, try next model
          if (res.status === 404) {
            console.log(`Model ${cleanModelName} not found in v1, trying next...`);
            continue;
          }
          
          // For auth errors, don't try other models
          if (res.status === 401 || res.status === 403) {
            throw new Error(`Invalid Gemini API key. Please check your VITE_GEMINI_API_KEY in .env file. Get a new key from: https://makersuite.google.com/app/apikey\n\nError: ${res.status} - ${errorMessage}`);
          }
          
          // For rate limiting
          if (res.status === 429) {
            throw new Error(`Gemini API rate limit exceeded. Please wait a moment and try again.`);
          }
          
          // Continue to next model for other errors
          if (modelName === uniqueModels[uniqueModels.length - 1]) {
            // Try v1beta as last resort
            break;
          }
          continue;
        }

        const data = await res.json();
        console.log(`Gemini API Success (v1/${cleanModelName}):`, data);
        
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!responseText) {
          console.error("Empty response from Gemini:", data);
          errors.push(`[v1/${cleanModelName}] Empty response`);
          continue;
        }

        console.log("Successfully received response from Gemini");
        return responseText;
        
      } catch (error: any) {
        const errorMessage = error.message || String(error);
        errors.push(`[v1/${modelName}] ${errorMessage}`);
        console.error(`Error with model ${modelName}:`, errorMessage);
        
        // Continue to next model
        if (modelName !== uniqueModels[uniqueModels.length - 1]) {
          continue;
        }
      }
    }
    
    // If v1 failed, try v1beta with different model names
    console.log("v1 API failed, trying v1beta...");
    for (const modelName of uniqueModels) {
      try {
        const cleanModelName = modelName.replace(/^models\//, '');
        // For v1beta, try without -latest suffix
        const betaModelName = cleanModelName.replace(/-latest$/, '');
        const url = `${apiBase}/v1beta/models/${betaModelName}:generateContent?key=${apiKey}`;
        
        console.log(`[Gemini] Trying v1beta API with model: ${betaModelName}`);
        
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }]
          })
        });

        if (!res.ok) {
          const errorText = await res.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: { message: errorText } };
          }
          
          const errorMessage = errorData.error?.message || errorText;
          errors.push(`[v1beta/${betaModelName}] ${res.status}: ${errorMessage}`);
          console.error(`Gemini API Error (v1beta/${betaModelName}):`, res.status, errorMessage);
          
          if (modelName === uniqueModels[uniqueModels.length - 1]) {
            throw new Error(
              `All Gemini models failed.\n\n` +
              `Tried models: ${uniqueModels.join(', ')}\n\n` +
              `Errors:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n... and ${errors.length - 5} more` : ''}\n\n` +
              `Please check:\n` +
              `1. Your VITE_GEMINI_API_KEY is correct in .env file\n` +
              `2. The API key is valid (get one from: https://makersuite.google.com/app/apikey)\n` +
              `3. The API key has proper permissions\n` +
              `4. You haven't exceeded your API quota`
            );
          }
          continue;
        }

        const data = await res.json();
        console.log(`Gemini API Success (v1beta/${betaModelName}):`, data);
        
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!responseText) {
          console.error("Empty response from Gemini:", data);
          errors.push(`[v1beta/${betaModelName}] Empty response`);
          continue;
        }

        console.log("Successfully received response from Gemini");
        return responseText;
        
      } catch (error: any) {
        const errorMessage = error.message || String(error);
        errors.push(`[v1beta/${modelName}] ${errorMessage}`);
        console.error(`Error with model ${modelName} (v1beta):`, errorMessage);
        
        if (modelName === uniqueModels[uniqueModels.length - 1]) {
          throw new Error(
            `All Gemini models failed.\n\n` +
            `Tried models: ${uniqueModels.join(', ')}\n\n` +
            `Errors:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n... and ${errors.length - 5} more` : ''}\n\n` +
            `Please check:\n` +
            `1. Your VITE_GEMINI_API_KEY is correct in .env file\n` +
            `2. The API key is valid (get one from: https://makersuite.google.com/app/apikey)\n` +
            `3. The API key has proper permissions\n` +
            `4. You haven't exceeded your API quota`
          );
        }
        continue;
      }
    }
    
    throw new Error(
      `All Gemini models failed.\n\n` +
      `Tried: ${uniqueModels.join(', ')}\n\n` +
      `Errors: ${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n... and ${errors.length - 5} more` : ''}`
    );
    
  } catch (error) {
    console.error("Error in generateGeminiResponse:", error);
    throw error;
  }
}
