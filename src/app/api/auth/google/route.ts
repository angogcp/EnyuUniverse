import { NextResponse } from 'next/server';

// Lazily require googleapis to avoid build errors
let google: any = null;
try {
  google = require('googleapis').google;
} catch (e) {
  console.warn('googleapis not loaded');
}

export async function GET(request: Request) {
  const client_id = process.env.GOOGLE_CLIENT_ID;
  const client_secret = process.env.GOOGLE_CLIENT_SECRET;

  if (!google) {
    return NextResponse.json({ error: 'Google APIs module not loaded' }, { status: 500 });
  }

  if (!client_id || !client_secret) {
    return NextResponse.json({ 
      error: 'Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env.local.' 
    }, { status: 400 });
  }

  // Dynamically resolve redirect URI to support Vercel deployments
  const requestUrl = new URL(request.url);
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http:' : 'https:';
  const redirectUri = `${protocol}//${host}/api/auth/callback`;

  const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirectUri
  );

  // Request drive scope and offline access to get a refresh token
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive'
    ],
    prompt: 'consent' // Forces consent screen to ensure refresh token is returned
  });

  return NextResponse.redirect(authUrl);
}
