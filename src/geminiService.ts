
import { GoogleGenAI, Type } from "@google/genai";
import { UserPreferences, Recommendation, Recipe, Category, Restaurant } from "./types";

let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is missing. AI features will not work.");
    }
    aiInstance = new GoogleGenAI({ apiKey: apiKey || 'dummy-key' });
  }
  return aiInstance;
};

/**
 * 让 AI 从用户的“私人菜单”中根据当前偏好挑选最合适的一道菜。
 */
// Fix: Updated return type from Promise<string> to Promise<{ selectedId: string; reason: string }>
// to resolve the destructuring error in App.tsx (line 102).
export const selectRecipeFromPool = async (prefs: UserPreferences, pool: Recommendation[]): Promise<{ selectedId: string; reason: string }> => {
  const ai = getAI();
  const poolData = pool.map(r => ({ id: r.id, name: r.name, tags: r.tags, description: r.description }));
  
  const prompt = `你是一个美食管家。请从以下用户的私人菜谱库中，根据用户当下的偏好，挑选出最合适的一道菜。
  
  用户偏好：
  心情: ${prefs.mood}
  预算: ${prefs.budget}
  菜系偏好: ${prefs.cuisine}
  忌口/要求: ${prefs.restrictions || '无'}

  私人菜谱库：
  ${JSON.stringify(poolData)}

  请只返回被选中菜品的 id 字符串。`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          selectedId: { type: Type.STRING, description: "The id of the selected recipe." },
          reason: { type: Type.STRING, description: "Why this fits the user's preferences in Chinese." }
        },
        required: ["selectedId", "reason"]
      }
    }
  });

  return JSON.parse(response.text);
};

/**
 * 让 AI 从用户的“餐馆列表”中根据当前偏好挑选最合适的一家店。
 */
export const selectRestaurantFromPool = async (prefs: UserPreferences, pool: Restaurant[]): Promise<{ selectedId: string; reason: string }> => {
  const ai = getAI();
  const poolData = pool.map(r => ({ 
    id: r.id, 
    name: r.name, 
    cuisine: r.cuisine, 
    location: r.location, 
    avgPrice: r.avgPrice,
    status: r.status,
    overallRating: r.overallRating,
    notes: r.notes
  }));
  
  const prompt = `你是一个美食向导。请从以下用户的餐馆列表中，根据用户当下的偏好，挑选出最合适的一家店。
  
  用户偏好：
  心情: ${prefs.mood}
  预算: ${prefs.budget} (严格标准：省钱简餐指人均<50, 适中消费指人均100-200, 犒劳一下指人均>200)
  地点: ${prefs.location}
  忌口/要求: ${prefs.restrictions || '无'}

  餐馆列表：
  ${JSON.stringify(poolData)}

  请只返回被选中餐馆的 id 字符串。`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          selectedId: { type: Type.STRING, description: "The id of the selected restaurant." },
          reason: { type: Type.STRING, description: "Why this fits the user's preferences in Chinese." }
        },
        required: ["selectedId", "reason"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const getFoodRecommendation = async (prefs: UserPreferences): Promise<Recommendation> => {
  const ai = getAI();
  const prompt = `Based on these preferences:
  Mood: ${prefs.mood}
  Budget: ${prefs.budget}
  Cuisine Preference: ${prefs.cuisine}
  Dietary Restrictions: ${prefs.restrictions || 'None'}

  Recommend ONE specific delicious dish. Be creative but realistic. 
  The response must be in Chinese.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "The name of the dish in Chinese." },
          description: { type: Type.STRING, description: "Short appetizing description in Chinese." },
          reason: { type: Type.STRING, description: "Why this fits the user's mood and preferences in Chinese." },
          tags: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "3-4 keywords like '辣', '健康', '暖心' etc."
          },
          calories: { type: Type.STRING, description: "Estimated calorie range (e.g. 400-600 kcal)." },
          prepTime: { type: Type.STRING, description: "Estimated preparation time (e.g. 15分钟, 1小时)." },
          difficulty: { type: Type.STRING, description: "One of: 简单, 中等, 困难" },
          funFact: { type: Type.STRING, description: "A fun culinary fact about this dish in Chinese." }
        },
        required: ["name", "description", "reason", "tags", "calories", "funFact", "prepTime", "difficulty"]
      }
    }
  });

  const data = JSON.parse(response.text);
  return {
    ...data,
    id: Date.now().toString()
  };
};

export const getDetailedRecipe = async (dishName: string): Promise<Recipe> => {
  const ai = getAI();
  const prompt = `Provide a detailed recipe for "${dishName}" in Chinese. 
  Include a list of ingredients with amounts, step-by-step cooking instructions, and some pro tips.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          ingredients: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                item: { type: Type.STRING },
                amount: { type: Type.STRING }
              },
              required: ["item", "amount"]
            }
          },
          steps: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          tips: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["ingredients", "steps", "tips"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const analyzeDishImage = async (base64Data: string, mimeType: string): Promise<Recommendation> => {
  const ai = getAI();
  const prompt = `Analyze this food image. Identify the dish and provide a detailed Chinese recipe for it. 
  Return the name, a short description, ingredients with amounts, steps, tips, tags, estimated calories, and a fun fact.`;

  // Fix: Wrapped multi-part content in { parts: [...] } as required by the SDK.
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          category: { 
            type: Type.STRING, 
            description: "One of: 肉类, 蔬菜, 主食, 汤品, 甜点/饮品, 其他" 
          },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          calories: { type: Type.STRING },
          prepTime: { type: Type.STRING, description: "Estimated preparation time" },
          difficulty: { type: Type.STRING, description: "One of: 简单, 中等, 困难" },
          funFact: { type: Type.STRING },
          recipe: {
            type: Type.OBJECT,
            properties: {
              ingredients: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    item: { type: Type.STRING },
                    amount: { type: Type.STRING }
                  },
                  required: ["item", "amount"]
                }
              },
              steps: { type: Type.ARRAY, items: { type: Type.STRING } },
              tips: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["ingredients", "steps", "tips"]
          }
        },
        required: ["name", "description", "tags", "calories", "funFact", "recipe"]
      }
    }
  });

  const data = JSON.parse(response.text);
  return {
    ...data,
    id: Date.now().toString(),
    reason: "根据您上传的精美菜肴识别生成",
    isCustom: true
  };
};

export const generateFoodImage = async (dishName: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { text: `A high-quality, professional food photography of a delicious ${dishName}. Close up, appetizing, warm lighting, restaurant style, 4k.` }
      ]
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return 'https://picsum.photos/800/800'; // Fallback
};
