import React, { useEffect, useState } from "react";
import axios from "axios";
import { X } from "lucide-react";
import { useUserStore } from "../stores/useUserStore.js";
import { motion } from "framer-motion";
import { formatPrice } from "../utils/currency.js";
import { useStoreSettings } from "./StoreSettingsContext.jsx";
const AllUsers = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showCartModal, setShowCartModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const {user} = useUserStore();
 
  const fetchUsers = async () => { 
    try {
      setLoading(true);
      const res = await axios.get(
        `/api/admin/users?search=${search}&role=${roleFilter}`,
        { withCredentials: true }
      );
      setUsers(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminRole = async (id) => {
    try {
      await axios.put(
        `/api/admin/users/${id}/role`,
        {},
        { withCredentials: true }
      );
      fetchUsers();
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter]);
  const {settings} = useStoreSettings()
  if (loading)
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="flex space-x-2 mb-6">
          <div
            className="h-4 w-4 bg-gray-700 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          ></div>
          <div
            className="h-4 w-4 bg-gray-700 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          ></div>
          <div
            className="h-4 w-4 bg-gray-700 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          ></div>
        </div>
        <p className="text-gray-600 font-medium animate-pulse">
          Please wait, Loading data...
        </p>
      </div>
    );

  return (
    <>
      <motion.div
        className="py-6 px-4 bg-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="text-2xl font-bold mb-4">User Management</h1>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <input
            type="text"
            placeholder="name / email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border p-2 rounded-md w-64"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border p-2 rounded-md"
          >
            <option value="">All Roles</option>
            <option value="customer">Customers</option>
            <option value="admin">Admins</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-white rounded-lg shadow no-scroll">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                {/* <th className="text-left px-4 py-2 border">Id</th> */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Cart
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider ">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user) => (
                  <tr
                    key={user._id}
                    className="border-b border-gray-100 hover:bg-gray-100 transition "
                  >
                    {/* <td className="px-2 py-2 border">{user._id}</td> */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {user.name || user.firstname + " " + user.lastname}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {user.phones?.find((p) => p.isDefault)?.number ||
                        user.phones?.[0]?.number ||
                        "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {user?.addresses?.find((a) => a.isDefault)
                        ? `${user.addresses.find((a) => a.isDefault).landmark}, 
       ${user.addresses.find((a) => a.isDefault).lga}, 
       ${user.addresses.find((a) => a.isDefault).city}, 
       ${user.addresses.find((a) => a.isDefault).state}`
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowCartModal(true);
                        }}
                        className="px-3 py-1 bg-gray-700 text-white rounded-md"
                      >
                        View
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                      {user.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center space-x-2 ">
                      <button
                        onClick={() => toggleAdminRole(user._id)}
                        className={`px-3 py-1 text-sm  rounded-md text-white ${
                          user.role === "admin" ? "bg-red-500" : "bg-blue-600"
                        }`}
                      >
                        {user.role === "admin" ? "Remove" : "Promot"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-4 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Cart Modal */}
        {showCartModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
            <div className="bg-white rounded-lg p-6 w-[90%] max-w-lg relative">
              <button
                onClick={() => setShowCartModal(false)}
                className="absolute top-2 right-2 text-gray-500 hover:text-black"
              >
                <X />
              </button>
              <h2 className="text-xl font-bold mb-4">
                {selectedUser.firstname || selectedUser.name}'s Cart
              </h2>

              {selectedUser.cartItems.length > 0 ? (
                <ul className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedUser.cartItems.map((item) => (
                    <li
                      key={item._id}
                      className="flex items-center justify-between border p-2 rounded-md"
                    >
                      <div>
                        <p className="font-semibold">{item.product?.name}</p>
                        <p className="text-sm text-gray-600">
                          Qty: {item.quantity} | 
                          {formatPrice(item.product?.price, settings?.currency)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Size: {item?.size}
                        </p>
                        <p className="text-sm text-gray-600">
                          Color: {item.color}
                        </p>
                      </div>
                      {item.product?.images?.[0] && (
                        <img
                          src={item.product.images[0]}
                          alt="Product"
                          className="w-12 h-12 rounded-md object-cover"
                        />
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600">No items in cart</p>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
};

export default AllUsers;
