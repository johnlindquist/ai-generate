// Name: Fix Script
// Shortcut: opt f

import "@johnlindquist/kit"
import { scriptChain } from "../lib/chain"

let { activeTextEditorFilePath } = await readJson(kitPath("db", "vscode.json"))
let contents = await readFile(activeTextEditorFilePath, "utf-8")

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

// Name:
// Description: Generate a < 50 character description for your script

Fix the //AI-TODO comments in the following script:
`

let scriptContents = await scriptChain(rules, contents)

let name = path.parse(activeTextEditorFilePath).name
let scriptName = `${name}-fixed.ts`
let scriptPath = kenvPath("scripts", scriptName)

await writeFile(scriptPath, scriptContents)
await edit(scriptPath)
