import { CallbackManager } from "langchain/callbacks"

export let createChain = async (
  promptTemplate: string,
  handlers: Parameters<typeof CallbackManager.fromHandlers>[0]
) => {
  let { ChatOpenAI } = await import("langchain/chat_models")
  let { ConversationChain } = await import("langchain/chains")
  let { CallbackManager } = await import("langchain/callbacks")
  let { BufferMemory } = await import("langchain/memory")
  let { MessagesPlaceholder } = await import("langchain/prompts")
  let { ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate } = await import(
    "langchain/prompts"
  )

  let prompt = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate(promptTemplate.trim()),
    new MessagesPlaceholder("history"),
    HumanMessagePromptTemplate.fromTemplate("{input}"),
  ])

  let openAIApiKey = await env("OPENAI_API_KEY", {
    hint: `Grab a key from <a href="https://platform.openai.com/account/api-keys">here</a>`,
  })

  let llm = new ChatOpenAI({
    modelName: "gpt-4",
    openAIApiKey,
    streaming: true,
    callbackManager: CallbackManager.fromHandlers(handlers),
  })

  let memory = new BufferMemory({
    returnMessages: true,
  })

  let chain = new ConversationChain({
    llm,
    prompt,
    memory,
  })

  return chain
}

let editorId = 0
let savePath = ``

export let editorChain = async (prompt: string, input: string) => {
  let commands = []
  let currentEditorId = editorId

  if (!savePath) {
    let { default: slugify } = await import("slugify")
    let name = slugify(input.slice(0, 20), { lower: true, trim: true })
    savePath = tmpPath(`${name}.txt`)
  }

  let createShortcut = (num: number) => {
    return {
      key: `${cmd}+${num}`,
      name: `Select ${num}`,
      bar: "right" as const,
      onPress: async input => {
        let selected = input
          .split(`*`)
          .map(text => text.trim())
          .filter(Boolean)[num - 1]

        submit(selected)
      },
    }
  }

  let createRegenShortcut = chain => {
    return {
      key: `${cmd}+4`,
      name: "Regenerate",
      bar: "right" as const,
      onPress: async input => {
        setInput("")
        chain.call({
          input: "Generate 3 more. Start each with a * and a space.",
        })
      },
    }
  }
  let shortcuts = [createShortcut(1), createShortcut(2), createShortcut(3)]

  let id = null
  let chain = await createChain(prompt, {
    handleLLMStart: async (llm, prompts) => {
      log(prompts.join("\n"))
      setInterval(async () => {
        if (commands.length) {
          let command = commands.shift()
          command()
        }
      }, 100)
    },
    handleLLMNewToken: async token => {
      if (!token) return
      if (currentEditorId !== editorId) return
      commands.push(async () => {
        await editor.append(token)
        await appendFile(savePath, token)
      })
    },
    handleLLMEnd: async (output, verbose) => {
      clearInterval(id)
      await Promise.all(commands)
    },
  })
  let result = await editor({
    onInit: async () => {
      await chain.call({
        input,
      })
    },
    shortcuts: [...shortcuts, createRegenShortcut(chain)],
  })
  editorId++
  return result
}

export let scriptChain = async (prompt: string, input: string) => {
  let { default: Bottleneck } = await import("bottleneck")
  let limiter = new Bottleneck({
    maxConcurrent: 1,
    minTime: 25,
  })

  let currentEditorId = editorId

  if (!savePath) {
    let { default: slugify } = await import("slugify")
    let name = slugify(input.slice(0, 20), { lower: true, trim: true })
    savePath = tmpPath(`${name}.txt`)
  }

  let chain = await createChain(prompt, {
    handleLLMStart: async (llm, prompts) => {
      log(prompts.join("\n"))
    },
    handleLLMNewToken: limiter.wrap(async token => {
      if (!token) return
      if (currentEditorId !== editorId) return
      await editor.append(token)
      await appendFile(savePath, token)
    }),
  })
  let result = await editor({
    language: "javascript",
    onInit: async () => {
      await chain.call({
        input,
      })
    },
  })
  editorId++
  return result
}

export let miniChain = async (prompt: string, input: string, separator: string) => {
  let choices = []
  let currentTokens = ``

  if (!savePath) {
    let { default: slugify } = await import("slugify")
    let name = slugify(input.slice(0, 20), { lower: true, trim: true })
    savePath = tmpPath(`${name}.txt`)
  }

  let createRegenShortcut = chain => {
    return {
      key: `${cmd}+4`,
      name: "Regenerate",
      bar: "right" as const,
      onPress: async input => {
        setInput("")
        chain.call({
          input: `Generate 3 more. Start each with a ${separator}`,
        })
      },
    }
  }

  let chain = await createChain(prompt, {
    handleLLMStart: async (llm, prompts) => {
      log(prompts.join("\n"))
    },
    handleLLMNewToken: async token => {
      if (!token) return
      currentTokens += token
      choices = currentTokens
        .split(separator)
        .map(text => text.trim())
        .filter(Boolean)
        .map((text, index) => {
          return {
            id: choices?.[index]?.id || uuid(),
            name: text,
            value: text,
          }
        })
      setChoices(choices)
    },
    handleLLMEnd: async (output, verbose) => {},
  })
  let result = await mini({
    onInit: async () => {
      await chain.call({
        input,
      })
    },
    shortcuts: [createRegenShortcut(chain)],
  })

  return result
}

export let miniPreviewChain = async (prompt: string, input: string, separator: string) => {
  let choices = []
  let currentTokens = ``

  if (!savePath) {
    let { default: slugify } = await import("slugify")
    let name = slugify(input.slice(0, 20), { lower: true, trim: true })
    savePath = tmpPath(`${name}.txt`)
  }

  let createRegenShortcut = chain => {
    return {
      key: `${cmd}+4`,
      name: "Regenerate",
      bar: "right" as const,
      onPress: async input => {
        setInput("")
        chain.call({
          input: `Generate 3 more. Start each with a ${separator}`,
        })
      },
    }
  }

  let chain = await createChain(prompt, {
    handleLLMStart: async (llm, prompts) => {
      log(prompts.join("\n"))
    },
    handleLLMNewToken: async token => {
      if (!token) return
      currentTokens += token
      choices = currentTokens
        .split(separator)
        .map(text => text.trim())
        .filter(Boolean)
        .map((text, index) => {
          return {
            id: choices?.[index]?.id || uuid(),
            name: text,
            value: text,
            preview: md(text),
          }
        })
      setChoices(choices)
    },
    handleLLMEnd: async (output, verbose) => {},
  })
  let result = await mini({
    height: PROMPT.HEIGHT.BASE,
    onInit: async () => {
      await chain.call({
        input,
      })
    },
    shortcuts: [createRegenShortcut(chain)],
  })

  return result
}
