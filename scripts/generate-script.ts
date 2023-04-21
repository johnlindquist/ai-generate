// Name: Generate Script

import "@johnlindquist/kit"
import { scriptChain } from "../lib/chain"

let rules = `
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
`

let goal = await editor("What is the goal of your script?")

let scriptContents = await scriptChain(rules, goal)

let { default: slugify } = await import("slugify")
let generatedName = scriptContents.split("\n")[0].split("Name: ")[1]

let name = slugify(generatedName, { lower: true, trim: true })
let scriptName = `${name}.ts`
let scriptPath = kenvPath("scripts", scriptName)

await writeFile(scriptPath, scriptContents)

let reflectedScriptContents = await scriptChain(
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
)

let reflectedScriptName = `${name}-reflected.ts`
let reflectedScriptPath = kenvPath("scripts", reflectedScriptName)
await writeFile(reflectedScriptPath, reflectedScriptContents)
await edit(reflectedScriptPath)
