import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, password, hash } = body;

    // Validate required fields
    if (!action || !password) {
      return NextResponse.json(
        {
          error: 'Missing required fields: action and password are required',
          code: 'MISSING_REQUIRED_FIELDS',
        },
        { status: 400 }
      );
    }

    // Validate action type
    if (!['verify', 'hash', 'both'].includes(action)) {
      return NextResponse.json(
        {
          error: 'Invalid action. Must be one of: verify, hash, both',
          code: 'INVALID_ACTION',
        },
        { status: 400 }
      );
    }

    console.log(`[bcrypt-test] Starting action: ${action}`);
    console.log(`[bcrypt-test] Password length: ${password.length}`);

    // Handle 'verify' action
    if (action === 'verify') {
      if (!hash) {
        return NextResponse.json(
          {
            error: 'Hash is required for verify action',
            code: 'MISSING_HASH',
          },
          { status: 400 }
        );
      }

      console.log(`[bcrypt-test] Verifying hash: ${hash.substring(0, 20)}...`);

      const isValid = await bcrypt.compare(password, hash);

      console.log(`[bcrypt-test] Verification result: ${isValid}`);

      return NextResponse.json({
        valid: isValid,
        message: isValid
          ? 'Password verification successful'
          : 'Password verification failed',
      });
    }

    // Handle 'hash' action
    if (action === 'hash') {
      console.log('[bcrypt-test] Generating new hash with 10 rounds...');

      const newHash = await bcrypt.hash(password, 10);

      console.log(`[bcrypt-test] Generated hash: ${newHash.substring(0, 20)}...`);

      return NextResponse.json({
        hash: newHash,
        message: 'Password hashed successfully',
      });
    }

    // Handle 'both' action
    if (action === 'both') {
      if (!hash) {
        return NextResponse.json(
          {
            error: 'Hash is required for both action',
            code: 'MISSING_HASH',
          },
          { status: 400 }
        );
      }

      console.log('[bcrypt-test] Starting both verification and hashing...');

      // Step 1: Verify old hash
      console.log(`[bcrypt-test] Verifying old hash: ${hash.substring(0, 20)}...`);
      const oldHashValid = await bcrypt.compare(password, hash);
      console.log(`[bcrypt-test] Old hash verification result: ${oldHashValid}`);

      // Step 2: Generate new hash
      console.log('[bcrypt-test] Generating new hash with 10 rounds...');
      const newHash = await bcrypt.hash(password, 10);
      console.log(`[bcrypt-test] Generated new hash: ${newHash.substring(0, 20)}...`);

      // Step 3: Verify new hash
      console.log('[bcrypt-test] Verifying new hash...');
      const newHashValid = await bcrypt.compare(password, newHash);
      console.log(`[bcrypt-test] New hash verification result: ${newHashValid}`);

      return NextResponse.json({
        oldHashValid,
        newHash,
        newHashValid,
        message: `Old hash ${oldHashValid ? 'valid' : 'invalid'}, new hash generated and ${newHashValid ? 'verified successfully' : 'verification failed'}`,
      });
    }

    // This should never be reached due to earlier validation
    return NextResponse.json(
      {
        error: 'Unexpected error in action handling',
        code: 'UNEXPECTED_ERROR',
      },
      { status: 500 }
    );
  } catch (error) {
    console.error('[bcrypt-test] Error:', error);

    // Handle specific bcrypt errors
    if (error instanceof Error) {
      if (error.message.includes('Invalid salt')) {
        return NextResponse.json(
          {
            error: 'Invalid hash format provided',
            code: 'INVALID_HASH_FORMAT',
            details: error.message,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: 'Internal server error: ' + error.message,
          code: 'INTERNAL_ERROR',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}