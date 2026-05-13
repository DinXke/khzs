import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, createSession, createUser } from '@/lib/db';
import { hashPassword, verifyPassword, generateSessionToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email en wachtwoord zijn verplicht' },
        { status: 400 }
      );
    }

    let user = getUserByEmail(email);

    if (!user) {
      const passwordHash = hashPassword(password);
      user = createUser(email, passwordHash, 'viewer');
    } else {
      if (!verifyPassword(password, user.password_hash)) {
        return NextResponse.json(
          { error: 'Ongeldig wachtwoord' },
          { status: 401 }
        );
      }
    }

    const token = generateSessionToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    createSession(user.id, token, expiresAt);

    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        }
      },
      { status: 200 }
    );

    response.cookies.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    response.cookies.set('user_role', user.role, {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Interne serverfout' },
      { status: 500 }
    );
  }
}
