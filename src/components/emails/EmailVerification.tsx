import { 
  Html, 
  Body, 
  Container, 
  Section, 
  Heading, 
  Text, 
  Button, 
  Hr 
} from '@react-email/components';
import * as React from 'react';

interface EmailVerificationEmailProps {
  userName: string;
  verificationUrl: string;
}

export function EmailVerificationEmail({ 
  userName, 
  verificationUrl 
}: EmailVerificationEmailProps) {
  return (
    <Html>
      <Body style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f5f5f5' }}>
        <Container style={{ maxWidth: '500px', margin: '0 auto', backgroundColor: '#ffffff' }}>
          <Section style={{ padding: '40px 20px', textAlign: 'center', backgroundColor: '#6B46C1' }}>
            <Heading style={{ color: '#ffffff', margin: '0', fontSize: '26px' }}>
              ✨ Verify Your Email
            </Heading>
          </Section>

          <Section style={{ padding: '40px 30px', textAlign: 'center' }}>
            <Text style={{ fontSize: '16px', color: '#333', marginBottom: '10px' }}>
              Welcome to Dira Tarot, {userName}!
            </Text>
            <Text style={{ fontSize: '14px', color: '#666', lineHeight: '1.6', marginTop: '0' }}>
              We're excited to have you join our mystical community. To complete your registration 
              and start your spiritual journey, please verify your email address by clicking the button below.
            </Text>
          </Section>

          <Section style={{ padding: '0 30px 40px', textAlign: 'center' }}>
            <Button
              href={verificationUrl}
              style={{
                backgroundColor: '#6B46C1',
                color: '#ffffff',
                padding: '14px 40px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: 'bold',
                fontSize: '16px',
                display: 'inline-block',
              }}
            >
              Verify Email Address
            </Button>
          </Section>

          <Hr style={{ borderColor: '#e5e7eb', margin: '0 30px' }} />

          <Section style={{ padding: '30px', textAlign: 'center' }}>
            <Text style={{ fontSize: '12px', color: '#999', lineHeight: '1.6', margin: '0' }}>
              This verification link will expire in 24 hours. If you didn't create an account 
              with Dira Tarot, please ignore this email.
            </Text>
            <Text style={{ fontSize: '12px', color: '#999', marginTop: '20px' }}>
              If the button doesn't work, copy and paste this link into your browser:
            </Text>
            <Text style={{ fontSize: '11px', color: '#6B46C1', marginTop: '10px', wordBreak: 'break-all' }}>
              {verificationUrl}
            </Text>
          </Section>

          <Section style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f9fafb' }}>
            <Text style={{ fontSize: '12px', color: '#999', margin: '0' }}>
              © 2025 Dira Tarot. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
