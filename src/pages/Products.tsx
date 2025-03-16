import { useEffect, useState } from "react";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

const db = getFirestore();

const Products = () => {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [newProduct, setNewProduct] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      const querySnapshot = await getDocs(collection(db, "db/products"));
      setProducts(
        querySnapshot.docs.map(
          (doc) =>
            ({ id: doc.id, ...doc.data() } as { id: string; name: string })
        )
      );
    };
    fetchProducts();
  }, []);

  const handleAddProduct = async () => {
    if (isAdmin && newProduct) {
      await addDoc(collection(db, "db/products"), { name: newProduct });
      setNewProduct("");
      alert("Product added!");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (isAdmin) {
      await deleteDoc(doc(db, "db/products", id));
      alert("Product deleted!");
    }
  };

  return (
    <div className="p-5">
      <h2 className="text-2xl font-bold">Manage Products</h2>
      {isAdmin ? (
        <>
          <input
            type="text"
            className="border p-2 mt-2"
            placeholder="New Product"
            value={newProduct}
            onChange={(e) => setNewProduct(e.target.value)}
          />
          <button
            className="bg-blue-500 text-white p-2 ml-2"
            onClick={handleAddProduct}
          >
            Add Product
          </button>
          <ul>
            {products.map((product) => (
              <li key={product.id} className="mt-2 flex justify-between">
                {product.name}
                <button
                  className="bg-red-500 text-white p-1"
                  onClick={() => handleDeleteProduct(product.id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-red-500">
          You do not have permission to manage products.
        </p>
      )}
    </div>
  );
};
export default Products;
