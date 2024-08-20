import { createCanvas, loadImage, registerFont } from 'canvas';
import path from 'path';

// Register a font (you'll need to add a font file to your project)
registerFont(path.resolve('./public/fonts/Arial.ttf'), { family: 'Arial' });

export default async function handler(req, res) {
  try {
    const { text } = req.query;

    const [year, ...eventText] = text.split(':');

    const canvas = createCanvas(1200, 630);
    const ctx = canvas.getContext('2d');

    // Set background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, 1200, 630);

    // Set text styles
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';

    // Draw year
    ctx.font = 'bold 60px Arial';
    ctx.fillText(year, 600, 200);

    // Draw event text
    ctx.font = '40px Arial';
    const eventLines = wrapText(ctx, eventText.join(':'), 1100);
    eventLines.forEach((line, index) => {
      ctx.fillText(line, 600, 280 + index * 50);
    });

    // Convert canvas to buffer
    const buffer = canvas.toBuffer('image/png');

    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).send('Error generating image');
  }
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + " " + word).width;
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}