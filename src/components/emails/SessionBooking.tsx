import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface SessionBookingEmailProps {
  userName: string;
  sessionType: string;
  date: string;
  time: string;
  duration: number;
  notes?: string;
}

export const SessionBookingEmail = ({
  userName,
  sessionType,
  date,
  time,
  duration,
  notes,
}: SessionBookingEmailProps) => {
  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Html>
      <Head />
      <Preview>Session Booking Confirmed - Dira Tarot</Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f5f5f5' }}>
        <Container style={{ margin: '0 auto', padding: '20px 0', maxWidth: '600px' }}>
          <Section style={{ backgroundColor: '#4c1d95', padding: '20px', borderRadius: '8px 8px 0 0' }}>
            <Text style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', color: '#fff', textAlign: 'center' }}>
              ✓ Session Confirmed
            </Text>
          </Section>

          <Section style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '0 0 8px 8px' }}>
            <Text style={{ fontSize: '18px', margin: '0 0 20px 0' }}>
              Hi {userName},
            </Text>
            <Text style={{ fontSize: '16px', margin: '0 0 20px 0' }}>
              Your tarot session has been successfully booked! We're excited to guide you on your spiritual journey.
            </Text>

            <Section
              style={{
                padding: '20px',
                backgroundColor: '#f9f9f9',
                borderRadius: '4px',
                marginBottom: '20px',
              }}
            >
              <Text style={{ margin: '0 0 12px 0', fontSize: '16px' }}>
                <strong style={{ color: '#4c1d95' }}>Session Type:</strong><br />
                {sessionType}
              </Text>
              <Text style={{ margin: '0 0 12px 0', fontSize: '16px' }}>
                <strong style={{ color: '#4c1d95' }}>Date:</strong><br />
                {formattedDate}
              </Text>
              <Text style={{ margin: '0 0 12px 0', fontSize: '16px' }}>
                <strong style={{ color: '#4c1d95' }}>Time:</strong><br />
                {time}
              </Text>
              <Text style={{ margin: '0', fontSize: '16px' }}>
                <strong style={{ color: '#4c1d95' }}>Duration:</strong><br />
                {duration} minutes
              </Text>
            </Section>

            {notes && (
              <Section>
                <Text style={{ fontSize: '16px', margin: '0 0 10px 0' }}>
                  <strong style={{ color: '#4c1d95' }}>Your Notes:</strong>
                </Text>
                <Text style={{ fontSize: '14px', margin: '0 0 20px 0', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '4px', fontStyle: 'italic' }}>
                  {notes}
                </Text>
              </Section>
            )}

            <Text style={{ fontSize: '16px', margin: '20px 0' }}>
              We'll send you a reminder 24 hours before your session. If you need to reschedule or have any questions, please don't hesitate to contact us.
            </Text>

            <Hr style={{ borderTop: '1px solid #eee', margin: '20px 0' }} />

            <Text style={{ fontSize: '14px', color: '#666', margin: '0' }}>
              Looking forward to connecting with you,<br />
              <strong>The Dira Tarot Team</strong>
            </Text>

            <Text style={{ fontSize: '12px', color: '#999', marginTop: '20px' }}>
              If you need to cancel or reschedule, please contact us at least 24 hours in advance.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};
