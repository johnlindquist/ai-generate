// Name: Generate Tweet

import "@johnlindquist/kit"
import { createChain } from "../lib/chain"

let tweetChain = await createChain(`Generate a hot take based on the following topic. Limit to 240 characters.`, {
  handleLLMNewToken: async token => {
    if (!token) return
    editor.append(token)
  },
})

let input = await arg("Enter a topic for your tweet")

await editor({
  onInit: async () => {
    await tweetChain.call({
      input,
    })
  },
})
