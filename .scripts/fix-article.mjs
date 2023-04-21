// Users/johnlindquist/.kenv/kenvs/ai-generate/scripts/fix-article.ts
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
var editorChain = async (prompt, input) => {
  let commands = [];
  let currentEditorId = editorId;
  if (!savePath) {
    let { default: slugify } = await import("slugify");
    let name2 = slugify(input.slice(0, 20), { lower: true, trim: true });
    savePath = tmpPath(`${name2}.txt`);
  }
  let createShortcut = (num) => {
    return {
      key: `${cmd}+${num}`,
      name: `Select ${num}`,
      bar: "right",
      onPress: async (input2) => {
        let selected = input2.split(`*`).map((text) => text.trim()).filter(Boolean)[num - 1];
        submit(selected);
      }
    };
  };
  let createRegenShortcut = (chain2) => {
    return {
      key: `${cmd}+4`,
      name: "Regenerate",
      bar: "right",
      onPress: async (input2) => {
        setInput("");
        chain2.call({
          input: "Generate 3 more. Start each with a * and a space."
        });
      }
    };
  };
  let shortcuts = [createShortcut(1), createShortcut(2), createShortcut(3)];
  let id = null;
  let chain = await createChain(prompt, {
    handleLLMStart: async (llm, prompts) => {
      log(prompts.join("\n"));
      setInterval(async () => {
        if (commands.length) {
          let command = commands.shift();
          command();
        }
      }, 100);
    },
    handleLLMNewToken: async (token) => {
      if (!token)
        return;
      if (currentEditorId !== editorId)
        return;
      commands.push(async () => {
        await editor.append(token);
        await appendFile(savePath, token);
      });
    },
    handleLLMEnd: async (output, verbose) => {
      clearInterval(id);
      await Promise.all(commands);
    }
  });
  let result = await editor({
    onInit: async () => {
      await chain.call({
        input
      });
    },
    shortcuts: [...shortcuts, createRegenShortcut(chain)]
  });
  editorId++;
  return result;
};

// Users/johnlindquist/.kenv/kenvs/ai-generate/scripts/fix-article.ts
var { activeTextEditorFilePath } = await readJson(kitPath("db", "vscode.json"));
var contents = await readFile(activeTextEditorFilePath, "utf-8");
var rules = `
I'm loading in an article you wrote.
Follow my instructions in the "// AI" comments to fix the article
`;
var scriptContents = await editorChain(rules, contents);
var name = path.parse(activeTextEditorFilePath).name;
var scriptName = `${name}-fixed.ts`;
var scriptPath = kenvPath("scripts", scriptName);
await writeFile(scriptPath, scriptContents);
await edit(scriptPath);
