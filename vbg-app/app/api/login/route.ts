import { NextResponse } from 'next/server';
import axios from 'axios';

export const dynamic = 'force-dynamic';
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://app.veribuilds.com';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Forward the login request to the backend
    const response = await axios.post(`${BACKEND_URL}/api/login`, {
      email,
      password,
    }, {
      withCredentials: true // This is needed to handle cookies
    });

    // Get the set-cookie header from the backend response
    const setCookieHeader = response.headers['set-cookie'];
    const responseHeaders = new Headers();
    
    if (setCookieHeader) {
      // Forward the set-cookie header to the client
      responseHeaders.set('Set-Cookie', setCookieHeader.join('; '));
    }

    // Return the user data with success flag and token
    return new NextResponse(JSON.stringify({
      success: true,
      user: response.data.user,
      message: 'Login successful',
      token: response.data.token // Pass through the token from backend
    }), {
      status: 200,
      headers: {
        ...Object.fromEntries(responseHeaders),
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(
        { error: error.response.data?.error || 'Login failed' },
        { status: error.response.status }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred during login' },
      { status: 500 }
    );
  }
}
