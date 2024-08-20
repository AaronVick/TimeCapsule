import axios from 'axios';

const VERCEL_OG_API = `${process.env.NEXT_PUBLIC_BASE_URL}/api/og`;

function getEventByIndex(events, currentIndex) {
  const totalEvents = events.length;
  const index = ((currentIndex % totalEvents) + totalEvents) % totalEvents;
  return events[index];
}

async function handleHistoryNavigation(res, direction) {
  let historicalData;
  let currentIndex;

  if (process.env.todayData) {
    historicalData = JSON.parse(process.env.todayData);
    currentIndex = parseInt(process.env.currentIndex || '0');
  } else {
    console.error('Historical data not found in environment variable');
    return res.status(500).json({ error: 'Historical data not available' });
  }

  if (direction === 'next') {
    currentIndex += 1;
  } else if (direction === 'previous') {
    currentIndex -= 1;
  }

  process.env.currentIndex = currentIndex.toString();

  const event = getEventByIndex(historicalData.Events, currentIndex);
  const text = `${event.year}: ${event.text}`;
  const ogImageUrl = `${VERCEL_OG_API}?text=${encodeURIComponent(text)}`;

  console.log(`Serving event: ${text}`);

  res.setHeader('Content-Type', 'text/html');
  return res.status(200).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${ogImageUrl}" />
        <meta property="fc:frame:button:1" content="Previous" />
        <meta property="fc:frame:button:2" content="Next" />
        <meta property="fc:frame:button:3" content="Share" />
        <meta property="fc:frame:post_url" content="https://time-capsule-jade.vercel.app/api/historyFrame" />
      </head>
    </html>
  `);
}

export default async function handler(req, res) {
  console.log('Received request to historyFrame handler');
  console.log('Request method:', req.method);
  console.log('Request body:', JSON.stringify(req.body));

  try {
    if (req.method === 'POST') {
      const { untrustedData } = req.body;
      const buttonIndex = untrustedData?.buttonIndex;

      if (buttonIndex === 1) {
        return handleHistoryNavigation(res, 'previous');
      } else if (buttonIndex === 2) {
        return handleHistoryNavigation(res, 'next');
      } else if (buttonIndex === 3) {
        // Handle share functionality
        const shareText = encodeURIComponent(
          "Check out some moments in history for today!\n\n" +
          "Frame by @aaronv\n\n"
        );
        const shareLink = `https://warpcast.com/~/compose?text=${shareText}&embeds[]=https%3A%2F%2Ftime-capsule-jade.vercel.app%2F`;
        
        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta property="fc:frame" content="vNext" />
              <meta property="fc:frame:image" content="${VERCEL_OG_API}?text=${encodeURIComponent('Check out some moments in history for today!')}" />
              <meta property="fc:frame:button:1" content="Back to History" />
              <meta property="fc:frame:post_url" content="https://time-capsule-jade.vercel.app/api/historyFrame" />
            </head>
          </html>
        `);
      } else {
        return handleHistoryNavigation(res, 'current');
      }
    } else {
      console.log('Method not allowed:', req.method);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
}