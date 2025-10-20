import React, { useEffect, useState } from "react";
import axios from "axios";

const AllUsers = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showCartModal, setShowCartModal] = useState(false);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="p-6">
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
        <table className="min-w-full border-collapse">
          <thead className="bg-gradient-to-br from-white via-gray-100 to-gray-300">
            <tr>
              <th className="p-3 text-left">Id</th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Phone</th>
              <th className="p-3 text-left">Role</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="p-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : users.length > 0 ? (
              users.map((user) => (
                <tr
                  key={user._id}
                  className="border-b even:bg-white  odd:bg-gray-200 hover:bg-gray-300 transition "
                >
                  <td className="px-4 py-2 border-b border-gray-700">
                    {user._id}
                  </td>
                  <td className="px-4 py-2 border-b border-gray-700">
                    {user.name}
                  </td>
                  <td className="px-4 py-2 border-b border-gray-700">
                    {user.email}
                  </td>
                  <td className="px-4 py-2 border-b border-gray-700">
                    {user.phones?.find((p) => p.isDefault)?.number ||
                      user.phones?.[0]?.number ||
                      "N/A"}
                  </td>
                  <td className="p-3 capitalize">{user.role}</td>
                  <td className="p-3 text-center space-x-2">
                    <button
                      onClick={() => toggleAdminRole(user._id)}
                      className={`px-3 py-1 rounded-md text-white ${
                        user.role === "admin" ? "bg-red-500" : "bg-blue-600"
                      }`}
                    >
                      {user.role === "admin" ? "Remove Admin" : "Make Admin"}
                    </button>
                    {/* <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowCartModal(true);
                      }}
                      className="px-3 py-1 bg-gray-700 text-white rounded-md"
                    >
                      View Cart
                    </button> */}
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
              ✖
            </button>
            <h2 className="text-xl font-bold mb-4">
              {selectedUser.name}'s Cart
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
                        Qty: {item.quantity} | ${item.product?.price}
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
    </div>
  );
};

export default AllUsers;
