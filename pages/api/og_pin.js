import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'experimental-edge',
};

export default function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get('text');
    const photoUrl = searchParams.get('photoUrl');

    const [year, ...eventText] = text.split(':');
    const isFallback = photoUrl === 'default';

    if (isFallback) {
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
              color: '#ffffff',
              padding: '20px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 50, fontWeight: 'bold', marginBottom: '10px' }}>{year}</div>
            <div style={{ fontSize: 30, maxWidth: '80%', wordWrap: 'break-word' }}>{eventText.join(':')}</div>
          </div>
        ),
        { width: 1200, height: 630 }
      );
    }

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
            color: '#ffffff',
            padding: '20px',
            textAlign: 'center',
          }}
        >
          <div style={{ marginBottom: '20px' }}>
            <img src={photoUrl} alt="Historical event image" style={{ maxWidth: '100%', maxHeight: '50%' }} />
          </div>
          <div style={{ fontSize: 50, fontWeight: 'bold', marginBottom: '10px' }}>{year}</div>
          <div style={{ fontSize: 30, maxWidth: '80%', wordWrap: 'break-word' }}>{eventText.join(':')}</div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch (error) {
    return new Response('Error generating image', { status: 500 });
  }
}
