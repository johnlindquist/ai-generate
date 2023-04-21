// Name: Meme Generator
// Description: Create meme by overlaying text on 4th frame of Giphy search result

// I believe this script works as intended, but I will change console.log to display the message in the editor.

import "@johnlindquist/kit"
import fetch from "node-fetch"
import Jimp from "jimp"
import gifFrames from "gif-frames"

const GIPHY_API_KEY = await env("GIPHY_API_KEY")

// Prompt the user for meme text
const memeText = await arg("Enter meme text:")

// Search the Giphy API and get the first result matching meme text
const giphyResponse = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${memeText}&limit=1`)

const { data: giphyData } = await giphyResponse.json()
debugger

// Grab the GIF URL and load the GIF using Jimp
const gifUrl = giphyData[0].images.original.url

// Extract the 4th frame using gif-frames
const targetFrame = 3
const frameData = await gifFrames({ url: gifUrl, frames: targetFrame, cumulative: true })
const frame = frameData[0]

const getBufferFromStream = (stream): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks = []
    stream.on("data", chunk => chunks.push(chunk))
    stream.on("error", reject)
    stream.on("end", () => resolve(Buffer.concat(chunks)))
  })
}

const frameBuffer = await getBufferFromStream(frame.getImage())

const fourthFrame = await Jimp.read(frameBuffer)

// Overlay text on the frame in large meme-type lettering
const fontSize = Math.round(fourthFrame.bitmap.width * 0.15)

const font = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE)
const textWidth = Jimp.measureText(font, memeText)
const xPos = fourthFrame.bitmap.width / 2 - textWidth / 2
const yPos = fourthFrame.bitmap.height / 8
fourthFrame.print(font, xPos, yPos, memeText)

// Save the meme image
const memePath = tmpPath("meme.jpg")
await fourthFrame.writeAsync(memePath)
revealFile(memePath)
