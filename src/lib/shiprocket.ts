
import axios from 'axios';

const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL;
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD;
const BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

let authToken: string | null = null;
let tokenExpiry: number | null = null;

export async function getShiprocketToken() {
  if (authToken && tokenExpiry && Date.now() < tokenExpiry) {
    return authToken;
  }

  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: SHIPROCKET_EMAIL,
      password: SHIPROCKET_PASSWORD,
    });

    if (response.data.token) {
      authToken = response.data.token;
      // Token usually expires in 10 days, let's set it for 9 days to be safe
      tokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000;
      return authToken;
    }
    throw new Error('Failed to get Shiprocket token');
  } catch (error: any) {
    console.error('Shiprocket Auth Error:', error.response?.data || error.message);
    throw error;
  }
}

export async function createShiprocketOrder(orderData: any) {
  const token = await getShiprocketToken();
  try {
    const response = await axios.post(`${BASE_URL}/orders/create/adhoc`, orderData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('Shiprocket Create Order Error:', error.response?.data || error.message);
    throw error;
  }
}

export async function generateAWB(shipmentId: number) {
  const token = await getShiprocketToken();
  try {
    const response = await axios.post(`${BASE_URL}/courier/assign/awb`, {
      shipment_id: shipmentId,
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('Shiprocket Generate AWB Error:', error.response?.data || error.message);
    throw error;
  }
}

export async function getTrackingData(awbCode: string) {
  const token = await getShiprocketToken();
  try {
    const response = await axios.get(`${BASE_URL}/courier/track/awb/${awbCode}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('Shiprocket Tracking Error:', error.response?.data || error.message);
    throw error;
  }
}
