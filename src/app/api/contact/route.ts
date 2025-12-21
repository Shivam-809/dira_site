import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { contactMessages } from '@/db/schema';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, message } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { 
          error: 'All fields are required: name, email, and message',
          code: 'MISSING_REQUIRED_FIELDS' 
        },
        { status: 400 }
      );
    }

    // Trim inputs
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    // Validate non-empty after trimming
    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      return NextResponse.json(
        { 
          error: 'Name, email, and message cannot be empty',
          code: 'INVALID_INPUT' 
        },
        { status: 400 }
      );
    }

    // Validate email format
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return NextResponse.json(
        { 
          error: 'Invalid email format',
          code: 'INVALID_EMAIL' 
        },
        { status: 400 }
      );
    }

    // Create contact message
    const now = new Date().toISOString();
    const newMessage = await db.insert(contactMessages)
      .values({
        userName: trimmedName,
        userEmail: trimmedEmail.toLowerCase(),
        message: trimmedMessage,
        status: 'unread',
        createdAt: now,
        updatedAt: now
      })
      .returning();

    return NextResponse.json(newMessage[0], { status: 201 });

  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}