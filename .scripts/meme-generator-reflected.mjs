// Users/johnlindquist/.kenv/kenvs/ai-generate/scripts/meme-generator-reflected.ts
import "@johnlindquist/kit";
import fetch from "node-fetch";
import Jimp from "jimp";
import gifFrames from "gif-frames";
var GIPHY_API_KEY = await env("GIPHY_API_KEY");
var memeText = await arg("Enter meme text:");
var giphyResponse = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${memeText}&limit=1`);
var { data: giphyData } = await giphyResponse.json();
debugger;
var gifUrl = giphyData[0].images.original.url;
var targetFrame = 3;
var frameData = await gifFrames({ url: gifUrl, frames: targetFrame, cumulative: true });
var frame = frameData[0];
var getBufferFromStream = (stream) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
};
var frameBuffer = await getBufferFromStream(frame.getImage());
var fourthFrame = await Jimp.read(frameBuffer);
var fontSize = Math.round(fourthFrame.bitmap.width * 0.15);
var font = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
var textWidth = Jimp.measureText(font, memeText);
var xPos = fourthFrame.bitmap.width / 2 - textWidth / 2;
var yPos = fourthFrame.bitmap.height / 8;
fourthFrame.print(font, xPos, yPos, memeText);
var memePath = tmpPath("meme.jpg");
await fourthFrame.writeAsync(memePath);
revealFile(memePath);
