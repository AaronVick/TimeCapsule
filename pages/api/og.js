import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get('text');

    const [year, ...eventText] = text.split(':');

    return new ImageResponse(
      (
        <div
          style={{
            background: '#1a1a1a',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff',
            padding: '40px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 60, fontWeight: 'bold', marginBottom: '20px' }}>
            {year}
          </div>
          <div style={{ fontSize: 40, maxWidth: '80%', wordWrap: 'break-word' }}>
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