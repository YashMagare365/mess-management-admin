import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ref, push, set, onValue } from "firebase/database";
import { database } from "../../firebase";
import { onAuthStateChanged, signOut, getAuth } from "firebase/auth";
// import { useNavigate } from 'react-router-dom';

interface Order {
  id: string;
  uid: string;
  userName: string;
  mobile: string;
  address: string;
  total: number;
  status: string;
  orderType: string;
}

interface UserData {
  displayName: string;
  address: string;
}

const Dashboard: React.FC = () => {
  // const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryOrders, setDeliveryOrders] = useState<Order[]>([]);
  const [pickupOrders, setPickupOrders] = useState<Order[]>([]);
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const navigate = useNavigate();
  // const [productIds, setProductIds] = useState<any[]>([]);

  // const db = getDatabase();
  const auth = getAuth();

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
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  // Fetch Orders from Firebase
  useEffect(() => {
    if (!user) return;
    const ordersRef = ref(database, `orders/${user.uid}`);
    onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      console.log("DATA===>>", data);
      const demo = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
      const temp = Object.keys(data).map((key) => ({
        id: key,
        ...data[key].items,
      }));
      console.log("TEMP=====>>", temp);
      const matchingOrders = [];

      // Iterate over each group in temp
      for (let i = 0; i < temp.length; i++) {
        const orderGroup = temp[i];

        // Check if orderGroup has nested orders (array)
        if (Array.isArray(orderGroup)) {
          // Iterate over each order in the nested array
          for (let j = 0; j < orderGroup.length; j++) {
            const order = orderGroup[j];

            // Check if the order has a messId and matches the user's uid
            if (order && order.messId === user.uid) {
              console.log("order==>>", order);
              console.log("Matching orders==>", matchingOrders);
              matchingOrders.push(order);
            }
          }
        }
      }

      // Update the orders state with the matching orders
      console.log("Matching orders==>", matchingOrders);
      setOrders(matchingOrders);
      // const productIdsSet = new Set(productIds);
      // console.log("SET==>", productIdsSet);
      // const filteredItems = temp.filter((item) => productIdsSet.has(item.id));
      // console.log("filtered==>", filteredItems);

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
      setUserData(data);
    });
  }, [user]);

  // Fetch Products from Firebase
  useEffect(() => {
    if (!user) return;
    const productsRef = ref(database, `products/${user.uid}`);
    onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      console.log("DATA====>>", data);
      if (data) {
        const productList = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));

        console.log("prodList====>", productList[1]);
        // const tempArr = Object.entries(data).map(([id]) => ({
        //   id,
        // }));
        // console.log(tempArr);
        setProducts(productList);
      } else {
        setProducts([]);
      }
    });
  }, [user]);

  const handleAddProduct = async () => {
    if (!productName || !productPrice || !userData) {
      alert("Please fill in all fields.");
      return;
    }
    // console.log("user data"===> userData)

    const productRef = ref(database, `/products/${user.uid}`);
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
    const productRef = ref(database, `/products/${user.uid}/${productId}`);
    try {
      await set(productRef, null);
      alert("Product deleted successfully!");
    } catch (error: any) {
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
            {userData?.displayName}
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
                <ul className="divide-y divide-gray-200">
                  {orders.map((order: any, index: Number) => (
                    <li
                      key={String(index)}
                      onClick={() => {
                        // handleOrderClick(order.id, order);
                        navigate("/order", {
                          state: { orderId: order.id, order: order },
                        });
                      }}
                      className="p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                    >
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          Order ID: {order.id}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Mess Address: {order.messAdress}
                        </p>
                        <p className="text-sm text-gray-600">
                          Total Price: ₹{order.totalPrice}
                        </p>
                        <h4 className="text-md font-medium text-gray-700">
                          Items:
                        </h4>
                        <ul className="space-y-2">
                          {order.items && order.items.length > 0 ? (
                            order.items.map((item: any, itemIndex: Number) => (
                              <li
                                key={Number(itemIndex)}
                                className="bg-gray-100 p-3 rounded-lg"
                              >
                                <p className="text-sm text-gray-700">
                                  <span className="font-medium">Product:</span>{" "}
                                  {item.productName}
                                </p>
                                <p className="text-sm text-gray-700">
                                  <span className="font-medium">Quantity:</span>{" "}
                                  {item.quantity}
                                </p>
                                <p className="text-sm text-gray-700">
                                  <span className="font-medium">Price:</span> ₹
                                  {item.price}
                                </p>
                              </li>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500">
                              No items found in this order.
                            </p>
                          )}
                        </ul>
                      </div>
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
    </div>
  );
};

export default Dashboard;
