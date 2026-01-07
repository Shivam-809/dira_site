
const SHIPROCKET_API_URL = 'https://apiv2.shiprocket.in/v1/external';

let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

async function getAuthToken() {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    throw new Error('Shiprocket credentials not configured in .env');
  }

  // Check if token is still valid (valid for 10 days, we refresh after 9)
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const response = await fetch(`${SHIPROCKET_API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Shiprocket auth failed: ${error.message || response.statusText}`);
  }

  const data = await response.json();
  cachedToken = data.token;
  // Set expiry to 9 days from now (in milliseconds)
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
    throw new Error(`Shiprocket order creation failed: ${JSON.stringify(error)}`);
  }

  return await response.json();
}

export async function assignCourierAndGenerateAWB(shipmentId: number) {
  const token = await getAuthToken();

  // 1. Get recommended courier
  const courierResponse = await fetch(
    `${SHIPROCKET_API_URL}/courier/serviceability?shipment_id=${shipmentId}`,
    {
      headers: { 'Authorization': `Bearer ${token}` },
    }
  );

  if (!courierResponse.ok) {
    throw new Error('Failed to fetch courier serviceability');
  }

  const courierData = await courierResponse.json();
  const recommendedCourier = courierData.data.available_courier_companies[0];

  if (!recommendedCourier) {
    throw new Error('No serviceable couriers found for this shipment');
  }

  // 2. Assign courier and AWB
  const assignResponse = await fetch(`${SHIPROCKET_API_URL}/courier/assign/awb`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      shipment_id: shipmentId,
      courier_id: recommendedCourier.courier_company_id,
    }),
  });

  if (!assignResponse.ok) {
    const error = await assignResponse.json();
    throw new Error(`AWB assignment failed: ${JSON.stringify(error)}`);
  }

  return await assignResponse.json();
}

export async function trackShipment(awbCode: string) {
  const token = await getAuthToken();
  const response = await fetch(`${SHIPROCKET_API_URL}/courier/track/awb/${awbCode}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Failed to track shipment');
  }

  return await response.json();
}

export function verifyWebhook(token: string) {
  return token === process.env.SHIPROCKET_WEBHOOK_TOKEN;
}
