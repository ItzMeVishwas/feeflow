import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          background: 'transparent',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #F2A93B, #E8792B)',
            borderRadius: '39.6px',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '50%',
              background: 'linear-gradient(rgba(255,255,255,0.35), rgba(255,255,255,0))',
            }}
          />
          <svg
            viewBox="0 0 32 32"
            width={Math.round(size.width * 0.62)}
            height={Math.round(size.width * 0.62)}
          >
            <rect x="10" y="8" width="4.2" height="16" rx="2.1" fill="#1A1206" />
            <rect x="10" y="15" width="9" height="3.6" rx="1.8" fill="#1A1206" />
            <path
              d="M10 10 C 13 6.5, 16 13.5, 19 10 S 24 6.5, 25 10"
              fill="none"
              stroke="#1A1206"
              strokeWidth="4.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    ),
    { ...size },
  )
}
