import { NextRequest } from 'next/server';
import { db } from '@/db';
import { admin, adminSession } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface AdminSession {
  admin: {
    id: string;
    email: string;
    name: string;
    image: string | null;
  };
  session: {
    id: string;
    token: string;
    expiresAt: string;
  };
}

export async function verifyAdminRequest(request: NextRequest): Promise<{ admin?: any; error?: string; status?: number }> {
  const authHeader = request.headers.get('Authorization');
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    // Also check for token in standard session if needed, but for now stick to dedicated admin_token
    return { error: 'Authentication required', status: 401 };
  }

  if (!token) {
    return { error: 'Authentication token missing', status: 401 };
  }

  try {
    const sessions = await db
      .select()
      .from(adminSession)
      .where(eq(adminSession.token, token))
      .limit(1);

    if (sessions.length === 0) {
      return { error: 'Invalid session token', status: 401 };
    }

    const session = sessions[0];
    const sessionExpiry = new Date(session.expiresAt);
    const now = new Date();

    if (sessionExpiry < now) {
      await db.delete(adminSession).where(eq(adminSession.id, session.id));
      return { error: 'Session expired', status: 401 };
    }

    const admins = await db
      .select()
      .from(admin)
      .where(eq(admin.id, session.adminId))
      .limit(1);

    if (admins.length === 0) {
      return { error: 'Admin not found', status: 404 };
    }

    return { admin: admins[0] };
  } catch (error) {
    console.error('Admin verification error:', error);
    return { error: 'Internal server error during verification', status: 500 };
  }
}
