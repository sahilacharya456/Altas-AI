const fs = require('fs');
const path = require('path');

const clientPath = path.join(__dirname, 'src/altasai/clients/mlServiceClient.ts');
let content = fs.readFileSync(clientPath, 'utf8');

if (!content.includes("import { z } from 'zod';")) {
  content = "import { z } from 'zod';\n" + content;
  
  const zodSchemas = `
const IntentSchema = z.object({
  label: z.string(),
  confidence: z.number(),
  top3: z.array(z.object({ label: z.string(), confidence: z.number() })),
  model: z.string(),
  fallbackRecommended: z.boolean()
});

const EntitySchema = z.object({
  entities: z.array(z.object({ type: z.string(), value: z.unknown(), raw: z.string(), confidence: z.number() })),
  confidence: z.number(),
  missingFields: z.array(z.string()),
  clarificationNeeded: z.boolean()
});
`;
  content = content.replace("export interface MlIntentPrediction {", zodSchemas + "\nexport interface MlIntentPrediction {");
  
  content = content.replace(/this\.request<MlIntentPrediction>\('\/predict\/intent', \{ text \}\);/, 
    "this.request<MlIntentPrediction>('/predict/intent', { text }).then(res => res.ok && res.data ? { ...res, data: IntentSchema.parse(res.data) } : res);");

  content = content.replace(/this\.request<MlEntityPrediction>\('\/predict\/entities', \{ text \}\);/, 
    "this.request<MlEntityPrediction>('/predict/entities', { text }).then(res => res.ok && res.data ? { ...res, data: EntitySchema.parse(res.data) } : res);");

  fs.writeFileSync(clientPath, content);
  console.log("Added Zod schemas to mlServiceClient");
}
