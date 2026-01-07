const SHIPROCKET_API_BASE = 'https://apidocs.shiprocket.in/v1/external';

async function getShiprocketToken() {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password || email === 'your_shiprocket_email_here') {
    console.error('Shiprocket credentials not configured');
    return null;
  }

  try {
    const response = await fetch(`${SHIPROCKET_API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (data.token) {
      return data.token;
    }
    console.error('Failed to get Shiprocket token:', data);
    return null;
  } catch (error) {
    console.error('Error authenticating with Shiprocket:', error);
    return null;
  }
}

export async function createShiprocketOrder(orderData: any) {
  const token = await getShiprocketToken();
  if (!token) return null;

  try {
    // 1. Create Order
    const orderPayload = {
      ...orderData,
      pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary',
    };

    const orderResponse = await fetch(`${SHIPROCKET_API_BASE}/orders/create/adhoc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(orderPayload),
    });

    const orderResult = await orderResponse.json();
    console.log('Shiprocket Order Creation Result:', orderResult);

    if (orderResult.order_id && orderResult.shipment_id) {
      // 2. Generate AWB
      const awbResponse = await fetch(`${SHIPROCKET_API_BASE}/courier/assign/awb`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          shipment_id: orderResult.shipment_id,
        }),
      });

      const awbResult = await awbResponse.json();
      console.log('Shiprocket AWB Generation Result:', awbResult);

      return {
        shiprocket_order_id: orderResult.order_id,
        shipment_id: orderResult.shipment_id,
        awb_code: awbResult.response?.data?.awb_code || null,
        courier_name: awbResult.response?.data?.courier_name || null,
      };
    }

    return null;
  } catch (error) {
    console.error('Error creating Shiprocket order:', error);
    return null;
  }
}
