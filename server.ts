import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Modality, Type } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json({ limit: '10mb' }));

  // Helper function for GenAI client
  const getGenAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY është e nevojshme. Ju lutemi vendosni çelësin tuaj te Cilësimet.');
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  };

  // 1. AI Chat Endpoint (Supports text & optional image input, context-aware)
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { messages, userContext, imageBase64, imageMime } = req.body;
      const ai = getGenAI();

      const systemInstruction = `Ti je Hëna AI - asistentja personale, me mirëkuptim të thellë, empatike, e ngrohtë dhe shkencërisht e saktë për shëndetin e femrave, ciklin menstrual, hormonet dhe mirëqenien.
Ti flet me përdoruesen në gjuhën shqipe (ose në gjuhën e zgjedhur prej saj), me një ton përkrahës, mikpritës dhe miqësor.

INFORMATAT E CIKLIT TË PËRDORUESES SOT:
- Emri: ${userContext?.username || 'Vajzë'}
- Cikli sot: Dita ${userContext?.cycleDay || 'N/A'}, Faza ${userContext?.phaseName || 'N/A'}
- Përshkrimi i fazës: ${userContext?.phaseDescription || 'N/A'}
- Simptomat e fundit: ${userContext?.recentSymptoms || 'S’ka simptoma të shënuara'}
- Humori sot: ${userContext?.mood || 'S’ka të dhëna'}
- Marrja e ujit sot: ${userContext?.waterMl || 0} ml / ${userContext?.targetWaterMl || 2000} ml

UDHËZIME TË RËNDËSISHME:
1. Përgjigju në mënyrë të qartë, të ngrohtë dhe praktike.
2. Përdor emoji miqësore (🌸, 🌙, ✨, 💧, 🌿) për ta bërë bisedën komode dhe intime.
3. Nëse pyetja është mjekësore e rëndë, jep këshilla të dobishme por rikujto me mirësi që të konsultohet edhe me ginekologun/mjekun nëse simptomat vazhdojnë.
4. Nëse përdoruesja ngarkon një foto (p.sh. ushqim, çaj bimor, produkt, ose shënim), analizoje atë lidhur me ndikimin në hormone dhe fazën aktuale.`;

      const contents: any[] = [];

      // If messages array exists
      if (Array.isArray(messages) && messages.length > 0) {
        // Convert history
        for (const msg of messages) {
          contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
          });
        }
      }

      // If image is attached to the current request
      if (imageBase64 && imageMime) {
        const lastUser = contents.length > 0 && contents[contents.length - 1].role === 'user'
          ? contents[contents.length - 1]
          : null;
        
        const imagePart = {
          inlineData: {
            data: imageBase64,
            mimeType: imageMime
          }
        };

        if (lastUser) {
          lastUser.parts.unshift(imagePart);
        } else {
          contents.push({
            role: 'user',
            parts: [imagePart, { text: 'Analizo këtë imazh te lidhur me ciklin tim.' }]
          });
        }
      }

      if (contents.length === 0) {
        contents.push({
          role: 'user',
          parts: [{ text: 'Përshëndetje Hëna! Më jep një këshillë të shkurtër për sot.' }]
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.7
        }
      });

      res.json({ text: response.text });
    } catch (err: any) {
      console.error('Error in /api/ai/chat:', err);
      res.status(500).json({ error: err.message || 'Gabim gjatë procesimit të pyetjes suaj.' });
    }
  });

  // 2. AI Daily Insight Endpoint
  app.post('/api/ai/daily-insight', async (req, res) => {
    try {
      const { userContext } = req.body;
      const ai = getGenAI();

      const prompt = `Gjenero një analizë ditore të personalizuar dhe inspiruese në gjuhën shqipe për përdoruesen.
E dhëna e ciklit:
- Dita e ciklit: ${userContext?.cycleDay || 1}
- Faza: ${userContext?.phaseName || 'Menstruale'}
- Simptomat sot: ${userContext?.symptoms || 'Normale'}
- Humori sot: ${userContext?.mood || 'Mbarë'}

Krijo një përgjigje JSON me këtë strukturë presize:
{
  "title": "Titull të ngrohtë e inspirues e ditës",
  "hormoneStatus": "Një fali për gjendjen e estrogjenit/progesteronit sot",
  "dailyTip": "Këshillë kryesore ushqimore apo vetëkujdesi për sot",
  "energyLevel": "Shkalla e energjisë (p.sh. Low, Medium-High, Peak)",
  "affirmation": "Një afirmacion i bukur ditor"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              hormoneStatus: { type: Type.STRING },
              dailyTip: { type: Type.STRING },
              energyLevel: { type: Type.STRING },
              affirmation: { type: Type.STRING }
            },
            required: ['title', 'hormoneStatus', 'dailyTip', 'energyLevel', 'affirmation']
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json(parsed);
    } catch (err: any) {
      console.error('Error in /api/ai/daily-insight:', err);
      res.status(500).json({ error: err.message || 'Nuk u mundësua gjenerimi i insight ditor.' });
    }
  });

  // 3. AI Personalized Recipe & Exercise Recommendation Endpoint
  app.post('/api/ai/recommendations', async (req, res) => {
    try {
      const { phaseName, cycleDay, userGoal } = req.body;
      const ai = getGenAI();

      const prompt = `Je një nutristioniste dhe trajnere e specializuar për ciklin menstrual.
Jep rekomandime të personalizuara në gjuhën shqipe për fazën: "${phaseName}" (Dita ${cycleDay}).
Objektivi i përdorueses: "${userGoal || 'Balancim hormonal dhe energji'}".

Krijo një përgjigje JSON:
{
  "recipes": [
    {
      "name": "Emri i recetës",
      "prepTime": "15 min",
      "benefits": "Pse ndihmon në këtë fazë",
      "ingredients": ["përbërës 1", "përbërës 2", "përbërës 3"],
      "instructions": "Udhëzime të shkurtra përgatitjeje"
    }
  ],
  "exercises": [
    {
      "title": "Emri i ushtrimit / stërvitjes",
      "duration": "20 min",
      "intensity": "E ulët / E mesme / E lartë",
      "description": "Përshkrimi i ushtrimit dhe përfitimi hormonal"
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recipes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    prepTime: { type: Type.STRING },
                    benefits: { type: Type.STRING },
                    ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                    instructions: { type: Type.STRING }
                  },
                  required: ['name', 'prepTime', 'benefits', 'ingredients', 'instructions']
                }
              },
              exercises: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    duration: { type: Type.STRING },
                    intensity: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ['title', 'duration', 'intensity', 'description']
                }
              }
            },
            required: ['recipes', 'exercises']
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json(parsed);
    } catch (err: any) {
      console.error('Error in /api/ai/recommendations:', err);
      res.status(500).json({ error: err.message || 'Gabim gjatë marrjes së rekomandimeve.' });
    }
  });

  // 4. AI Text-to-Speech (TTS) Endpoint
  app.post('/api/ai/tts', async (req, res) => {
    try {
      const { text, voiceName } = req.body;
      const ai = getGenAI();

      const speechText = text || 'Përshëndetje e dashur! Dita yt le të jetë e mbushur me qetësi, dashuri dhe energji pozitive.';

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-tts-preview',
        contents: [{ parts: [{ text: speechText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' } // 'Kore', 'Zephyr', 'Puck'
            }
          }
        }
      });

      const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!audioBase64) {
        throw new Error('Nuk u gjenerua asnjë audio.');
      }

      res.json({ audioBase64 });
    } catch (err: any) {
      console.error('Error in /api/ai/tts:', err);
      res.status(500).json({ error: err.message || 'Gjenerimi i audios dështoi.' });
    }
  });

  // 5. AI Cycle Art & Aura Generator Endpoint
  app.post('/api/ai/generate-art', async (req, res) => {
    try {
      const { phaseName, moodPrompt } = req.body;
      const ai = getGenAI();

      const imagePrompt = `A serene, ethereal, fine art illustration representing womanhood, the moon phase "${phaseName || 'Luminous Moon'}", floral elegance, soft pastel gradient aesthetic, artistic glowing moonlight, high quality, peaceful mood: ${moodPrompt || 'harmony and self care'}. No words or text.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [{ text: imagePrompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: '1:1'
          }
        }
      });

      let imageUrl: string | null = null;
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (!imageUrl) {
        throw new Error('Imazhi nuk mund të krijohej.');
      }

      res.json({ imageUrl });
    } catch (err: any) {
      console.error('Error in /api/ai/generate-art:', err);
      res.status(500).json({ error: err.message || 'Krijimi i artit dështoi.' });
    }
  });

  // 6. AI Symptom & Pattern Analysis Endpoint
  app.post('/api/ai/analyze-symptoms', async (req, res) => {
    try {
      const { periodDaysLogs } = req.body;
      const ai = getGenAI();

      const prompt = `Ti je një eksperte e shëndetit riprodhues. Analizo historikun e mëposhtëm të logimeve të përdorueses me simptoma, dhimbje, humor dhe prurje.

Logimet e historikut:
${JSON.stringify(periodDaysLogs || [], null, 2)}

Jep një analizë sintetike në gjuhën shqipe:
1. Përmbledhje e trendeve kryesore (intensiteti i dhimbjes, simptomat më të shpeshta, humori).
2. 3 Këshilla të personalizuara e praktike për të ulur diskomfortin ose balancuar ciklin.
3. Tregues se kur duhet t'i kushtohet vëmendje e veçantë.

Krijo përgjigje JSON:
{
  "summary": "Tekst përmbledhës...",
  "patternObserved": "Trendi i vërejtur...",
  "recommendations": ["këshillë 1", "këshillë 2", "këshillë 3"],
  "medicalAlert": "Nëse është e nevojshme ose bosh"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              patternObserved: { type: Type.STRING },
              recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
              medicalAlert: { type: Type.STRING }
            },
            required: ['summary', 'patternObserved', 'recommendations']
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json(parsed);
    } catch (err: any) {
      console.error('Error in /api/ai/analyze-symptoms:', err);
      res.status(500).json({ error: err.message || 'Analiza e simptomave dështoi.' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('(.*)', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveri Hëna po funksionon në http://0.0.0.0:${PORT}`);
  });
}

startServer();
