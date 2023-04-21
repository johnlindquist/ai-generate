// Users/johnlindquist/.kenv/kenvs/ai-generate/scripts/generate-script.ts
import "@johnlindquist/kit";

// Users/johnlindquist/.kenv/kenvs/ai-generate/lib/chain.ts
var createChain = async (promptTemplate, handlers) => {
  let { ChatOpenAI } = await import("langchain/chat_models");
  let { ConversationChain } = await import("langchain/chains");
  let { CallbackManager } = await import("langchain/callbacks");
  let { BufferMemory } = await import("langchain/memory");
  let { MessagesPlaceholder } = await import("langchain/prompts");
  let { ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate } = await import("langchain/prompts");
  let prompt = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate(promptTemplate.trim()),
    new MessagesPlaceholder("history"),
    HumanMessagePromptTemplate.fromTemplate("{input}")
  ]);
  let openAIApiKey = await env("OPENAI_API_KEY", {
    hint: `Grab a key from <a href="https://platform.openai.com/account/api-keys">here</a>`
  });
  let llm = new ChatOpenAI({
    modelName: "gpt-4",
    openAIApiKey,
    streaming: true,
    callbackManager: CallbackManager.fromHandlers(handlers)
  });
  let memory = new BufferMemory({
    returnMessages: true
  });
  let chain = new ConversationChain({
    llm,
    prompt,
    memory
  });
  return chain;
};
var editorId = 0;
var savePath = ``;
var scriptChain = async (prompt, input) => {
  let { default: Bottleneck } = await import("bottleneck");
  let limiter = new Bottleneck({
    maxConcurrent: 1,
    minTime: 25
  });
  let currentEditorId = editorId;
  if (!savePath) {
    let { default: slugify2 } = await import("slugify");
    let name2 = slugify2(input.slice(0, 20), { lower: true, trim: true });
    savePath = tmpPath(`${name2}.txt`);
  }
  let chain = await createChain(prompt, {
    handleLLMStart: async (llm, prompts) => {
      log(prompts.join("\n"));
    },
    handleLLMNewToken: limiter.wrap(async (token) => {
      if (!token)
        return;
      if (currentEditorId !== editorId)
        return;
      await editor.append(token);
      await appendFile(savePath, token);
    })
  });
  let result = await editor({
    language: "javascript",
    onInit: async () => {
      await chain.call({
        input
      });
    }
  });
  editorId++;
  return result;
};

// Users/johnlindquist/.kenv/kenvs/ai-generate/scripts/generate-script.ts
var rules = `
## Formatting Rules
- Only write code and comments.
-- Do not wrap the code in markdown or other text.
-- Never use a codefence to wrap code

## TypeScript Rules
- Always include first import:
import "@johnlindquist/kit"
- "@johnlindquist/kit" declares globals, so don't destructure it or import it again.
- Use the latest TypeScript/JavaScript/node.js features.
- Use "top-level await" and avoid helper functions.
- If an extremely popular npm library would be helpful, use it.
- But only use the npm library if you are 100% confident in the API
- Use inline code comments to explain logic, but not to explain code.
- Begin the script with the following comments:
- If the user needs an environment variable, use:
let env = await env("NAME_OF_ENV_VAR")
- If the user should select a path or a file, use:
let selectedPath = await path()
- "path" is a global from "@johnlindquist/kit". Never use 'import path from "path"'
- If the user should input a one line string, use:
let input = await arg()
- If the user should input a multi-line string, use:
let input = await editor()
- Don't use console.log, instead display text in the editor:
let contents = await editor(text)
- Never use "require" or "createRequire"

// Name: Generate < 20 character name for your script
// Description: Generate a < 50 character description for your script

Generate a node.js esm TypeScript script that achieves the following goal:
`;
var goal = await editor("What is the goal of your script?");
var scriptContents = await scriptChain(rules, goal);
var { default: slugify } = await import("slugify");
var generatedName = scriptContents.split("\n")[0].split("Name: ")[1];
var name = slugify(generatedName, { lower: true, trim: true });
var scriptName = `${name}.ts`;
var scriptPath = kenvPath("scripts", scriptName);
await writeFile(scriptPath, scriptContents);
var reflectedScriptContents = await scriptChain(
  `Act as a TypeScript script generator that follows these rules:
  ${rules}
  `,
  `
  I asked you to create a script that achieves the following goal:
  ${goal}  
  
  You created this script:
  ${scriptContents}
  
  Reflect on your choices and improve the script. Use brief code comments for your reflections.
    `
);
var reflectedScriptName = `${name}-reflected.ts`;
var reflectedScriptPath = kenvPath("scripts", reflectedScriptName);
await writeFile(reflectedScriptPath, reflectedScriptContents);
await edit(reflectedScriptPath);
