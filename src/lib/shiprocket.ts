
const SHIPROCKET_API_URL = 'https://apiv2.shiprocket.in/v1/external';

let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

async function getAuthToken() {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const response = await fetch(`${SHIPROCKET_API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Shiprocket Auth Error:', error);
    throw new Error('Failed to authenticate with Shiprocket');
  }

  const data = await response.json();
  cachedToken = data.token;
  // Token is valid for 10 days, let's cache for 9 days to be safe
  tokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000;
  return cachedToken;
}

export async function createShiprocketOrder(orderData: any) {
  const token = await getAuthToken();

  const response = await fetch(`${SHIPROCKET_API_URL}/orders/create/adhoc`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Shiprocket Create Order Error:', error);
    throw new Error(error.message || 'Failed to create Shiprocket order');
  }

  return await response.json();
}

export async function generateAWB(shipmentId: number) {
  const token = await getAuthToken();

  const response = await fetch(`${SHIPROCKET_API_URL}/courier/assign/awb`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      shipment_id: shipmentId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Shiprocket Generate AWB Error:', error);
    // Don't throw here, just return the error so we can handle it
    return { success: false, error };
  }

  return await response.json();
}

export async function getTrackingData(awbCode: string) {
  const token = await getAuthToken();

  const response = await fetch(`${SHIPROCKET_API_URL}/courier/track/awb/${awbCode}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  return await response.json();
}
