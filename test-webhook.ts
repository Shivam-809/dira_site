
import { ShippingService } from "./src/lib/shipping";

async function test() {
  const payload = {
    awb: "1234567890",
    courier_name: "Delhivery",
    current_status: "Shipped",
    order_id: 5,
    scans: [
      {
        location: "Ludhiana",
        activity: "Package picked up from warehouse"
      }
    ]
  };

  console.log("Testing updateTracking...");
  const success = await ShippingService.updateTracking(payload);
  console.log("Success:", success);
}

test().catch(err => {
  console.error("CRASHED:", err);
});
