import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ref,
  push,
  set,
  onValue,
  getDatabase,
  update,
} from "firebase/database";
import { auth, database } from "../../firebase";
import { onAuthStateChanged, signOut, getAuth } from "firebase/auth";
import { Scanner } from "@yudiel/react-qr-scanner";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [deliveryOrders, setDeliveryOrders] = useState<any[]>([]);
  const [pickupOrders, setPickupOrders] = useState<any[]>([]);
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [userData, setUserData] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const db = getDatabase();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        console.log("Current user===>", currentUser);
        const idTokenResult = await currentUser.getIdTokenResult();
        if (idTokenResult.claims.admin) {
          setUser(currentUser);
          console.log(currentUser);
        } else {
          alert("Access Denied: You are not an admin.");
          navigate("/");
        }
      } else {
        navigate("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  // Fetch Orders from Firebase
  useEffect(() => {
    if (!user) return;
    const ordersRef = ref(database, "orders/");
    onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      const demo = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
      const filtered = demo.filter((order) => order.status === "Pending");
      const pickup = filtered.filter((order) => order.orderType === "Pickup");
      const delivery = filtered.filter(
        (order) => order.orderType === "Delivery"
      );
      setOrders(filtered);
      setDeliveryOrders(delivery);
      setPickupOrders(pickup);
    });

    const userRef = ref(database, "admins/" + user.uid);
    onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      console.log("User Data====>", data);
      setUserData(data);
    });
  }, [user]);

  // Fetch Products from Firebase
  useEffect(() => {
    if (!user) return;
    const productsRef = ref(database, "products/");
    onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const productList = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setProducts(productList);
      } else {
        setProducts([]);
      }
    });
  }, [user]);

  const handleOrderClick = (orderId: string, order: any) => {
    setSelectedOrderId(orderId);
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleScan = (result: string) => {
    if (result[0].rawValue === selectedOrderId) {
      alert("QR Code Matched!");
      update(ref(db, `/orders/${selectedOrderId}`), {
        status: "Delivered",
      })
        .then(() => alert("Order delivered successfully!"))
        .catch((error) =>
          alert("Error updating order status: " + error.message)
        );
      update(ref(db, `/users/${selectedOrder.uid}/orders/${selectedOrderId}`), {
        status: "Delivered",
      })
        .then(() => alert("Order delivered successfully!"))
        .catch((error) =>
          alert("Error updating order status: " + error.message)
        );
      setIsModalOpen(false);
    } else {
      alert("Invalid QR Code. Please scan the correct order QR.");
    }
  };

  const handleAddProduct = async () => {
    if (!productName || !productPrice) {
      alert("Please fill in all fields.");
      return;
    }

    const productRef = ref(database, "/products/");
    const newProductRef = push(productRef);
    await set(newProductRef, {
      productName: productName,
      price: parseFloat(productPrice),
      messId: user.uid,
      messName: userData.displayName,
      messAddress: userData.address,
    });

    setProductName("");
    setProductPrice("");
    alert("Product added successfully!");
  };

  const handleDeleteProduct = async (productId: string) => {
    const productRef = ref(database, `/products/${productId}`);
    try {
      await set(productRef, null);
      alert("Product deleted successfully!");
    } catch (error) {
      alert("Error deleting product: " + error.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  if (loading) return <p className="text-center text-xl">Loading...</p>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <div className="w-full max-w-5xl bg-white shadow-lg rounded-lg p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-700">
            {userData.displayName}
          </h2>
          <div className="gap-2 flex flex-row">
            <button
              onClick={() => setOrders(deliveryOrders)}
              className="bg-green-500 text-white p-2 rounded-2xl"
            >
              Delivery
            </button>
            <button
              onClick={() => setOrders(pickupOrders)}
              className="bg-green-500 text-white p-2 rounded-2xl"
            >
              Pickup
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>

        {/* Flex Row Layout for Orders & Add Product */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* View Orders Section */}
          <div className="bg-gray-50 p-4 rounded-lg shadow-md h-96">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">
              View Orders
            </h3>
            <div className="overflow-y-auto max-h-72 bg-white rounded-lg shadow p-4">
              {orders.length === 0 ? (
                <p className="text-gray-500 text-center">No orders found</p>
              ) : (
                <ul className="divide-y divide-gray-300">
                  {orders.map((order) => (
                    <li
                      key={order.id}
                      className="py-3 px-4 flex justify-between items-center bg-gray-50 rounded-md shadow-sm mb-2 cursor-pointer"
                      onClick={() => handleOrderClick(order.id, order)}
                    >
                      <div className="flex flex-col">
                        <p className="text-gray-700 font-semibold">
                          Name: {order.userName}
                        </p>
                        <p className="text-gray-700 font-semibold">
                          Phone: {order.mobile}
                        </p>
                        <span className="text-sm text-gray-500">
                          {order.address}
                        </span>
                      </div>
                      <span className="text-green-600 font-bold text-lg">
                        ₹{order.total}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Add Product Section */}
          <div className="bg-gray-50 p-4 rounded-lg shadow-md h-96">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">
              Add Product
            </h3>
            <div className="flex flex-col space-y-3">
              <input
                type="text"
                placeholder="Product Name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="border border-gray-300 rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                type="number"
                placeholder="Price"
                value={productPrice}
                onChange={(e) => setProductPrice(e.target.value)}
                className="border border-gray-300 rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={handleAddProduct}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
              >
                Add Product
              </button>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="bg-gray-50 p-4 rounded-lg shadow-md mt-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Products</h3>
          <div className="overflow-y-auto max-h-72 bg-white rounded-lg shadow p-4">
            {products.length === 0 ? (
              <p className="text-gray-500 text-center">No products found</p>
            ) : (
              <ul className="divide-y divide-gray-300">
                {products.map((product) => (
                  <li
                    key={product.id}
                    className="py-3 px-4 flex justify-between items-center bg-gray-50 rounded-md shadow-sm mb-2"
                  >
                    <div className="flex flex-col">
                      <p className="text-gray-700 font-semibold">
                        {product.productName}
                      </p>
                      <span className="text-sm text-gray-500">
                        ₹{product.price}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
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

export default Dashboard;
