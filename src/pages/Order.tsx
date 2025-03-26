import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getDatabase, ref, get, set, update } from "firebase/database";
import { Scanner } from "@yudiel/react-qr-scanner";
import { onAuthStateChanged, getAuth } from "firebase/auth";

// Function to generate Google Maps embed URL
const getMapUrl = (address: string) => {
  // Changed String to string
  const encodedAddress = encodeURIComponent(address);
  return `https://www.google.com/maps/embed/v1/place?key=${
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  }&q=${encodedAddress}`;
};

const OrderPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const db = getDatabase();
  const auth = getAuth();

  const { orderId, order } = location.state || {};
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isOrderReady, setIsOrderReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const idTokenResult = await currentUser.getIdTokenResult();
        if (idTokenResult.claims.admin) {
          setUser(currentUser);
        } else {
          alert("Access Denied: You are not an admin.");
          navigate("/");
        }
      } else {
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleOrderClick = (orderId: string, order: any) => {
    setSelectedOrderId(orderId);
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleScan = (result: any) => {
    if (result[0].rawValue === selectedOrderId && selectedOrder) {
      alert("QR Code Matched!");
      update(ref(db, `/orders/${user.uid}/${selectedOrderId}`), {
        status: "Delivered",
      })
        .then(() => alert("Order delivered successfully!"))
        .catch((error: any) =>
          alert("Error updating order status: " + error.message)
        );
      update(
        ref(
          db,
          `/users/${selectedOrder.uid}/orders/${order.messId}/${selectedOrderId}`
        ),
        {
          status: "Delivered",
        }
      )
        .then(() => alert("Order delivered successfully!"))
        .catch((error: any) =>
          alert("Error updating order status: " + error.message)
        );
      setIsModalOpen(false);
    } else {
      alert("Invalid QR Code. Please scan the correct order QR.");
    }
  };

  // Fixed the onClick handler to return a function instead of a Promise
  const handleOrderReady = (message: string) => {
    // Changed String to string
    return async (e: React.MouseEvent) => {
      e.preventDefault();
      setIsOrderReady(true);

      if (!order || !order.uid || !orderId) {
        console.error("Invalid order data. Cannot send notification.");
        alert("Invalid order data. Please check the order details.");
        return;
      }

      const db = getDatabase();
      const notificationRef = ref(db, `users/${order.uid}/notification`);

      try {
        const snapshot = await get(notificationRef);
        const existingNotifications = snapshot.exists() ? snapshot.val() : [];
        const newNotification = {
          message: message,
          timestamp: new Date().toISOString(),
          orderId: orderId,
          status: "Ready",
        };
        const updatedNotifications = [
          ...existingNotifications,
          newNotification,
        ];
        await set(notificationRef, updatedNotifications);
        alert("Notification sent successfully!");
      } catch (error) {
        console.error("Error adding notification to Firebase:", error);
        alert("Failed to send notification. Please try again.");
      }
    };
  };

  if (!order) {
    return <div className="p-4 text-red-500">No order data found.</div>;
  }

  return (
    <div className="p-6 font-sans bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Order Details</h1>
      <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Order ID: {order.orderId}
        </h2>
        <p className="text-gray-600 mb-2">
          <span className="font-medium">Status:</span> {order.status}
        </p>
        <p className="text-gray-600 mb-4">
          <span className="font-medium">Address:</span> {order.address}
        </p>
        <div className="mt-4">
          <iframe
            title={`Map for ${order.address}`}
            className="w-full h-64 rounded-lg shadow-sm border-0"
            src={getMapUrl(order.address)}
            allowFullScreen
          ></iframe>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex gap-4">
          {!isOrderReady && (
            <button
              onClick={handleOrderReady(
                "Your order is ready and out for delivery"
              )}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Order Ready
            </button>
          )}

          {isOrderReady && (
            <button
              onClick={() => {
                handleOrderReady("your order has reached the location");
              }}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              On Address
            </button>
          )}

          <button
            onClick={() => handleOrderClick(orderId, order)}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            Scan
          </button>
        </div>
      </div>
      {/* QR Code Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <h3 className="text-lg font-semibold mb-4">
              Scan QR Code for Order: {selectedOrderId}
            </h3>
            <Scanner
              onScan={handleScan}
              onError={(error) => console.error(error)}
            />
            <button
              onClick={() => setIsModalOpen(false)}
              className="mt-4 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderPage;
