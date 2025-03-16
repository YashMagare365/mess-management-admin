import React, { useState, useEffect } from "react";
import { getDatabase, ref, onValue, update } from "firebase/database";
import { Scanner } from "@yudiel/react-qr-scanner";
import { getAuth } from "firebase/auth";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [scanningOrderId, setScanningOrderId] = useState(null);
  const [selectedOrder, setOrderData] = useState({});
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const db = getDatabase();

  const auth = getAuth();

  auth.currentUser
    ?.getIdTokenResult()
    .then((idTokenResult) => {
      console.log("Admin Claim:", idTokenResult.claims);
    })
    .catch((error) => {
      console.error("Error getting token claims:", error);
    });

  useEffect(() => {
    const ordersRef = ref(db, "/orders");
    onValue(ordersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        // console.log("Data", data);
        const pendingOrders = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .filter((order) => order.status === "Pending");
        // console.log(pendingOrders);
        setOrders(pendingOrders);
      }
    });
  }, []);

  const startScanning = (order) => {
    setScanningOrderId(order.id);
    setOrderData(order);
    setIsScannerOpen(true);
  };

  const handleScan = (scannedData) => {
    // console.log("Scanned Data===>", scannedData[0].rawValue);
    if (scannedData[0].rawValue === scanningOrderId) {
      update(ref(db, `/orders/${scanningOrderId}`), {
        status: "Delivered",
      })
        .then(() => alert("Order delivered successfully!"))
        .catch((error) =>
          alert("Error updating order status: " + error.message)
        );
      update(ref(db, `/users/${selectedOrder.uid}/orders/${scanningOrderId}`), {
        status: "Delivered",
      })
        .then(() => alert("Order delivered successfully!"))
        .catch((error) =>
          alert("Error updating order status: " + error.message)
        );
    } else {
      alert("QR Code does not match the order ID!");
    }
    setIsScannerOpen(false);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Pending Orders</h2>
      <div>
        {orders.map((order) => (
          <div key={order.id} className="p-4 border mb-2 rounded bg-gray-100">
            <p className="text-lg font-semibold">Order ID: {order.id}</p>
            <p>Customer: {order.customerName}</p>
            <p>Total: ₹{order.total}</p>
            <button
              onClick={() => startScanning(order)}
              className="mt-2 bg-blue-600 text-white py-2 px-4 rounded"
            >
              Verify Delivery
            </button>
          </div>
        ))}
      </div>
      {isScannerOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-4 rounded shadow-lg">
            <h3 className="text-lg font-semibold mb-2">Scan QR Code</h3>
            <Scanner
              onScan={handleScan}
              onError={(err) => console.error(err)}
            />
            <button
              onClick={() => setIsScannerOpen(false)}
              className="mt-2 bg-red-600 text-white py-2 px-4 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
