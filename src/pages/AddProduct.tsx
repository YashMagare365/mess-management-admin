import { useState } from "react";
import { getDatabase, ref, push } from "firebase/database";

const AddProduct = () => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  const handleAddProduct = async () => {
    if (!name || !price) {
      alert("Please enter both name and price");
      return;
    }

    const db = getDatabase();
    const productsRef = ref(db, "products");

    push(productsRef, {
      name,
      price,
      availablity: true,
    })
      .then(() => {
        alert("Product added successfully!");
        setName("");
        setPrice("");
      })
      .catch((error) => {
        console.error("Error adding product:", error);
      });
  };

  return (
    <div className="p-5">
      <h2 className="text-2xl font-bold">Add Product</h2>
      <input
        type="text"
        placeholder="Product Name"
        className="border p-2 mt-2"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="number"
        placeholder="Price"
        className="border p-2 mt-2"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />
      <button
        className="bg-green-500 text-white p-2 mt-2"
        onClick={handleAddProduct}
      >
        Add Product
      </button>
    </div>
  );
};
export default AddProduct;
