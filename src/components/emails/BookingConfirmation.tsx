import {
  Html,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Button,
  Hr,
  Row,
  Column,
} from '@react-email/components';
import * as React from 'react';

interface BookingConfirmationEmailProps {
  userName: string;
  sessionType: string;
  sessionDate: string;
  sessionTime: string;
  duration: number;
  bookingId: string;
}

export function BookingConfirmationEmail({
  userName,
  sessionType,
  sessionDate,
  sessionTime,
  duration,
  bookingId,
}: BookingConfirmationEmailProps) {
  const formattedDate = new Date(sessionDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Html>
      <Body style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f5f5f5' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff' }}>
          <Section style={{ padding: '40px 20px', textAlign: 'center', backgroundColor: '#6B46C1' }}>
            <Heading style={{ color: '#ffffff', margin: '0', fontSize: '28px' }}>
              ✨ Booking Confirmed!
            </Heading>
          </Section>

          <Section style={{ padding: '30px 20px' }}>
            <Text style={{ fontSize: '16px', marginBottom: '15px', color: '#333' }}>
              Dear {userName},
            </Text>

            <Text style={{ fontSize: '14px', color: '#666', lineHeight: '1.6', marginBottom: '20px' }}>
              Thank you for booking a tarot session with Dira Tarot. Your mystical journey awaits! 
              We're excited to guide you through this spiritual experience.
            </Text>

            <Text style={{ fontSize: '14px', color: '#666', lineHeight: '1.6', marginBottom: '30px' }}>
              Your session has been confirmed with the following details:
            </Text>
          </Section>

          <Section style={{ padding: '0 20px 20px', margin: '0 20px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <Row style={{ padding: '20px 0' }}>
              <Column style={{ width: '50%', paddingRight: '10px' }}>
                <Text style={{ fontSize: '12px', color: '#999', margin: '0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Session Type
                </Text>
                <Text style={{ fontSize: '16px', fontWeight: 'bold', margin: '5px 0 0 0', color: '#333' }}>
                  {sessionType}
                </Text>
              </Column>
              <Column style={{ width: '50%', paddingLeft: '10px' }}>
                <Text style={{ fontSize: '12px', color: '#999', margin: '0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Booking ID
                </Text>
                <Text style={{ fontSize: '16px', fontWeight: 'bold', margin: '5px 0 0 0', color: '#6B46C1' }}>
                  #{bookingId}
                </Text>
              </Column>
            </Row>

            <Hr style={{ borderColor: '#e5e7eb', margin: '15px 0' }} />

            <Row style={{ padding: '15px 0' }}>
              <Column style={{ width: '50%', paddingRight: '10px' }}>
                <Text style={{ fontSize: '12px', color: '#999', margin: '0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Date
                </Text>
                <Text style={{ fontSize: '15px', fontWeight: '500', margin: '5px 0 0 0', color: '#333' }}>
                  {formattedDate}
                </Text>
              </Column>
              <Column style={{ width: '50%', paddingLeft: '10px' }}>
                <Text style={{ fontSize: '12px', color: '#999', margin: '0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Time
                </Text>
                <Text style={{ fontSize: '15px', fontWeight: '500', margin: '5px 0 0 0', color: '#333' }}>
                  {sessionTime}
                </Text>
              </Column>
            </Row>

            <Row style={{ padding: '15px 0 20px' }}>
              <Column>
                <Text style={{ fontSize: '12px', color: '#999', margin: '0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Duration
                </Text>
                <Text style={{ fontSize: '15px', fontWeight: '500', margin: '5px 0 0 0', color: '#333' }}>
                  {duration} minutes
                </Text>
              </Column>
            </Row>
          </Section>

          <Section style={{ padding: '30px 20px', textAlign: 'center' }}>
            <Text style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
              We'll contact you shortly to confirm the final details. Please ensure you're available at the scheduled time.
            </Text>
          </Section>

          <Hr style={{ borderColor: '#e5e7eb', margin: '20px' }} />

          <Section style={{ padding: '20px', textAlign: 'center' }}>
            <Text style={{ fontSize: '12px', color: '#999', lineHeight: '1.6', margin: '0' }}>
              If you need to reschedule or cancel, please contact us at least 24 hours in advance.
            </Text>
            <Text style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
              © 2025 Dira Tarot. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
