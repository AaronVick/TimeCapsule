import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'experimental-edge',
};

export default function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get('text');
    const photoUrl = searchParams.get('photoUrl');  // Get the image URL

    const [year, ...eventText] = text.split(':');

    return new ImageResponse(
      (
        <div
          style={{
            background: '#000000',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff',
            padding: '20px',
            textAlign: 'center',
          }}
        >
          {/* Display the image */}
          <div style={{ marginBottom: '20px' }}>
            <img 
              src={photoUrl === 'default' ? 'https://your-fallback-url.com/fallback-image.png' : photoUrl} 
              alt="Historical event" 
              style={{ maxWidth: '100%', maxHeight: '50%' }} 
            />
          </div>

          {/* Display the year and caption */}
          <div style={{ fontSize: 50, fontWeight: 'bold', marginBottom: '10px' }}>
            {year}
          </div>
          <div style={{ fontSize: 30, maxWidth: '80%', wordWrap: 'break-word' }}>
            {eventText.join(':')}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating image:', error);
    return new Response('Error generating image', { status: 500 });
  }
}
