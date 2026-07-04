import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

let google: any = null;
try {
  google = require('googleapis').google;
} catch (e) {
  console.warn('googleapis not loaded');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!google) {
    return NextResponse.json({ error: 'Google APIs module not loaded' }, { status: 500 });
  }

  if (!code) {
    return NextResponse.json({ error: 'Missing authorization code parameter' }, { status: 400 });
  }

  const client_id = process.env.GOOGLE_CLIENT_ID;
  const client_secret = process.env.GOOGLE_CLIENT_SECRET;

  if (!client_id || !client_secret) {
    return NextResponse.json({ error: 'Missing client credentials in environment' }, { status: 400 });
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

  try {
    const { tokens } = await oauth2Client.getToken(code);
    const refresh_token = tokens.refresh_token;

    if (!refresh_token) {
      // Sometimes if users have already authorized, Google does not return a refresh token unless prompted.
      // We force 'prompt: consent' in the authorization URL, but in case they still did not get it:
      return new NextResponse(`
        <html>
          <body style="font-family: sans-serif; padding: 40px; text-align: center; background-color: #FAF8F5; color: #2D2A26;">
            <h1 style="color: #9E523A;">⚠️ 未能获取刷新令牌</h1>
            <p>Google 没有返回 <code>refresh_token</code>。这通常是因为该应用之前已被授权过。</p>
            <p>请访问 <a href="https://myaccount.google.com/connections" target="_blank" style="color: #9E523A; font-weight: bold;">Google 账号关联设置</a>，移除对 "Project J" 的访问权限，然后重新尝试：</p>
            <a href="/api/auth/google" style="display: inline-block; margin-top: 20px; background-color: #9E523A; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; font-weight: bold;">重新进行授权</a>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    // Try to write refresh token to .env.local file (fails on read-only systems like Vercel)
    let envWritten = false;
    try {
      const envPath = path.join(process.cwd(), '.env.local');
      let envContent = '';
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      }

      // Remove any existing GOOGLE_REFRESH_TOKEN variable
      envContent = envContent.replace(/^GOOGLE_REFRESH_TOKEN=.*$/m, '');
      
      // Add the new refresh token
      envContent = envContent.trim() + `\nGOOGLE_REFRESH_TOKEN="${refresh_token}"\n`;

      fs.writeFileSync(envPath, envContent, 'utf8');
      envWritten = true;
    } catch (fsError) {
      console.warn('Failed to write .env.local (expected on read-only environments like Vercel):', fsError);
    }

    const successMessage = envWritten
      ? `<p>您的 Google Drive 刷新令牌已成功获取，并已自动追加写入 <code>.env.local</code> 文件。</p>`
      : `<p>您的 Google Drive 刷新令牌已成功获取！</p>
         <p style="color: #9E523A; font-weight: bold;">由于当前处于只读环境（如 Vercel），请手动在 Vercel 控制台添加以下环境变量：</p>
         <div style="background: #F4EFE6; padding: 15px; border-radius: 8px; font-family: monospace; margin: 20px 0; word-break: break-all; text-align: left; border: 1px solid #E8DFD0;">
           <strong>Key:</strong> <code style="background:#FAF8F5; padding: 2px 4px; border-radius: 4px;">GOOGLE_REFRESH_TOKEN</code><br/><br/>
           <strong>Value:</strong> <code style="background:#FAF8F5; padding: 2px 4px; border-radius: 4px;">${refresh_token}</code>
         </div>
         <p style="font-size: 11px; color: #888;">添加环境变量后，请重新部署 Vercel 项目以使变量生效。</p>`;

    return new NextResponse(`
      <html>
        <body style="font-family: sans-serif; padding: 40px; text-align: center; background-color: #FAF8F5; color: #2D2A26; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #9E523A;">✓ 授权成功！</h1>
          ${successMessage}
          <p>您现在可以通过上传画作来直接将其保存到您的 Google Drive 账户。</p>
          <a href="/" style="display: inline-block; margin-top: 20px; background-color: #9E523A; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; font-weight: bold;">返回主页</a>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });

  } catch (e: any) {
    console.error('Failed to exchange auth token:', e);
    return NextResponse.json({ error: 'Failed to exchange authorization token: ' + e.message }, { status: 500 });
  }
}
