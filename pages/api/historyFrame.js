import axios from 'axios';

const VERCEL_OG_API = `${process.env.NEXT_PUBLIC_BASE_URL}/api/og`;

function getEventByIndex(events, currentIndex) {
  const totalEvents = events.length;
  const index = ((currentIndex % totalEvents) + totalEvents) % totalEvents;
  return events[index];
}

export default async function handler(req, res) {
  try {
    const { direction } = req.query;
    let historicalData;
    let currentIndex;

    if (process.env.todayData) {
      try {
        historicalData = JSON.parse(process.env.todayData);
      } catch (error) {
        console.error('Failed to parse historical data:', error);
        return res.status(500).json({ error: 'Failed to parse historical data' });
      }
      currentIndex = parseInt(process.env.currentIndex || '0', 10);
    } else {
      console.error('Historical data not found in environment variable');
      return res.status(500).json({ error: 'Historical data not available' });
    }

    if (direction === 'next') {
      currentIndex += 1;
    } else if (direction === 'previous') {
      currentIndex -= 1;
    } else {
      console.error('Invalid navigation direction:', direction);
      return res.status(400).json({ error: 'Invalid navigation direction' });
    }

    process.env.currentIndex = currentIndex.toString();
    const event = getEventByIndex(historicalData.Events, currentIndex);
    
    if (!event) {
      console.error('Event not found at index:', currentIndex);
      return res.status(404).json({ error: 'Event not found' });
    }

    const text = `${event.year}: ${event.text}`;
    const ogImageUrl = `${VERCEL_OG_API}?text=${encodeURIComponent(text)}`;

    console.log(`Serving event: ${text} (Index: ${currentIndex})`);

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>On This Day in History</title>
        
        <!-- Farcaster Frame Meta Tags -->
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${ogImageUrl}" />
        
        <!-- Button Meta Tags -->
        <meta property="fc:frame:button:1:action" content="link" />
        <meta property="fc:frame:button:1:target" content="/api/historyFrame?direction=previous" />
        <meta property="fc:frame:button:2:action" content="link" />
        <meta property="fc:frame:button:2:target" content="/api/historyFrame?direction=next" />
        <meta property="fc:frame:button:3:action" content="link" />
        <meta property="fc:frame:button:3:target" content="https://warpcast.com/~/compose?text=Check+out+today's+moments+in+history!%0A%0AFrame+by+%40aaronv&embeds[]=https%3A%2F%2Ftime-capsule-jade.vercel.app" />
      </head>
      <body>
        <main>
          <h1>${text}</h1>
          <img src="${ogImageUrl}" alt="Historical event" />
        </main>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('An unexpected error occurred:', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
}
