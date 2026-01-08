export const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://31.97.144.132:3000',
  'http://31.97.144.132:4000',
  'https://31.97.144.132:3000',
  'https://31.97.144.132:4000',
  '*'
];

export const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'Expires',
    'X-Requested-With',
    'Accept',
    'X-CSRF-Token'
  ],
  exposedHeaders: [
    'Set-Cookie',
    'Content-Length',
    'Content-Range'
  ],
  optionsSuccessStatus: 200
};

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000,
  domain: process.env.NODE_ENV === 'production' ? '.31.97.144.132' : 'localhost'
};
