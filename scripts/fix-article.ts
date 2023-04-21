// Name: Fix Article
// Shortcut: opt a

import "@johnlindquist/kit"
import { editorChain } from "../lib/chain"

let { activeTextEditorFilePath } = await readJson(kitPath("db", "vscode.json"))
let contents = await readFile(activeTextEditorFilePath, "utf-8")

let rules = `
I'm loading in an article you wrote.
Follow my instructions in the "// AI" comments to fix the article
`

let scriptContents = await editorChain(rules, contents)

let name = path.parse(activeTextEditorFilePath).name
let scriptName = `${name}-fixed.ts`
let scriptPath = kenvPath("scripts", scriptName)

await writeFile(scriptPath, scriptContents)
await edit(scriptPath)
