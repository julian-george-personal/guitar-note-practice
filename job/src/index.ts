import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime'
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'

const client = new BedrockRuntimeClient({ region: 'us-east-1' })
const MODEL_ID = process.env.MODEL_ID ?? 'us.anthropic.claude-haiku-4-5-20251001-v1:0'

const SYSTEM_PROMPT = `You are a guitar practice exercise generator. Output ONLY valid JSON — no prose, no code fences.

Notes use sharps (C#, not Db). String numbers: 1=high E, 2=B, 3=G, 4=D, 5=A, 6=low E (standard tuning).
Standard string octaves: 6→E2, 5→A2, 4→D3, 3→G3, 2→B3, 1→E4.

Omit any field that matches its default — only include it when the user's prompt requires a different value.

JSON schema (only description and mode are required; defaults shown):
{
  "description": "one-sentence description",
  "mode": "note" | "string",
  "notes": ["C","E","G"],               // pitch-class strings only ("C", "F#"). Never objects. No default.
  "scales": ["C major"],                // scale name strings only. No default.
  "targets": [{"string":1,"note":"E4"}], // explicit string+note pairs with octave. No default.
  "tuning": "EADGBE",                   // default: "EADGBE"
  "fretRange": "0-11",                  // default: "0-11", min 0, max 11
  "enabledStrings": [1,2,3,4,5,6],      // default: all strings
  "order": "random",                    // default: "random". options: "ascending"|"descending"|"sequence"
  "stepPattern": null,                  // default: null. If set: {"forward":2,"back":1,"skip":1}; skip: 1=steps, 2=thirds, 3=fourths
  "scaleChangeEvery": null              // default: null
}

mode "note": pitch-class recognition on any string/octave. Use "notes" or "scales" to define the pool.
mode "string": player must find the exact note on the exact string. Use "targets" for explicit positions.
stepPattern.skip: 1=adjacent degrees (default), 2=thirds, 3=fourths.`

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  if (event.requestContext.http.method === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' }
  }

  const { prompt } = JSON.parse(event.body ?? '{}')
  if (!prompt) {
    return { statusCode: 400, headers: CORS_HEADERS, body: 'missing prompt' }
  }

  const response = await client.send(new ConverseCommand({
    modelId: MODEL_ID,
    system: [{ text: SYSTEM_PROMPT }],
    messages: [{ role: 'user', content: [{ text: prompt }] }],
    inferenceConfig: { maxTokens: 600 },
  }))

  const text = response.output?.message?.content?.[0]?.text ?? ''

  return {
    statusCode: 200,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    body: text,
  }
}
