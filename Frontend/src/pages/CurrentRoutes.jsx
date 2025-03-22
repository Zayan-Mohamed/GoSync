import React, { useEffect } from "react";
import axios from "axios"; // ✅ Import axios
import useRouteStore from "../store/routeStore";
import Button from "../components/Button"; 
import Table from "../components/Table"; 
import { Trash2, Edit } from "lucide-react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const CurrentRoutes = () => {
  const { routes, fetchRoutes, deleteRoute } = useRouteStore();

  useEffect(() => {
    fetchRoutes(); // ✅ Use the store function
  }, [fetchRoutes]);

  // Ensure routes is always an array
  if (!Array.isArray(routes)) {
    console.error("routes is not an array:", routes);
    return <div>Loading routes...</div>;
  }

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">Current Routes</h2>
      <Table>
        <thead>
          <tr>
            <th className="p-2 border-b text-left">Route ID</th>
            <th className="p-2 border-b text-left">Start Location</th>
            <th className="p-2 border-b text-left">End Location</th>
            <th className="p-2 border-b text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {routes.length === 0 ? (
            <tr>
              <td colSpan="4" className="text-center p-4">
                No routes available.
              </td>
            </tr>
          ) : (
            routes.map((route) => (
              <tr key={route._id} className="hover:bg-gray-100">
                <td className="p-2 border-b">{route._id}</td>
                <td className="p-2 border-b">{route.startLocation}</td>
                <td className="p-2 border-b">{route.endLocation}</td>
                <td className="p-2 border-b flex gap-2">
                  <Button onClick={() => console.log("Edit route", route._id)}>
                    <Edit size={16} />
                  </Button>
                  <Button
                    className="bg-red-500 hover:bg-red-600 text-white"
                    onClick={() => deleteRoute(route._id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  );
};

export default CurrentRoutes;
