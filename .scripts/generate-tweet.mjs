// Users/johnlindquist/.kenv/kenvs/ai-generate/scripts/generate-tweet.ts
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

// Users/johnlindquist/.kenv/kenvs/ai-generate/scripts/generate-tweet.ts
var tweetChain = await createChain(`Generate a hot take based on the following topic. Limit to 240 characters.`, {
  handleLLMNewToken: async (token) => {
    if (!token)
      return;
    editor.append(token);
  }
});
var input = await arg("Enter a topic for your tweet");
await editor({
  onInit: async () => {
    await tweetChain.call({
      input
    });
  }
});
