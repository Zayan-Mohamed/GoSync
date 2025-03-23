import React, { useState, useEffect } from "react";
import { getBuses, addBus, updateBus, deleteBus } from "../services/busService";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

function BusList() {
  const [buses, setBuses] = useState([]);
  const [newBus, setNewBus] = useState("");
  const [editingBus, setEditingBus] = useState({ id: null, value: "" });

  useEffect(() => {
    getBuses()
      .then((data) => {
        console.log("Fetched buses:", data);
        setBuses(data);
      })
      .catch((error) => console.error("Error fetching buses:", error));
  }, []);

  // Handle adding a new bus
  const handleAddBus = () => {
    if (!newBus.trim()) return;
    addBus({ bus_number: newBus })
      .then((data) => {
        setBuses((prevBuses) => [...prevBuses, data]);
        setNewBus("");
      })
      .catch((error) => console.error("Error adding bus:", error));
  };

  // Handle deleting a bus
  const handleDeleteBus = (id) => {
    deleteBus(id)
      .then(() => {
        setBuses((prevBuses) => prevBuses.filter((bus) => bus._id !== id));
      })
      .catch((error) => console.error("Error deleting bus:", error));
  };

  // Handle editing a bus
  const handleEditBus = (id) => {
    const busToEdit = buses.find((bus) => bus._id === id);
    setEditingBus({ id: busToEdit._id, value: busToEdit.busNumber });
  };

  // Handle updating a bus
  const handleUpdateBus = (id) => {
    if (!editingBus.value.trim()) return;
    updateBus(id, { bus_number: editingBus.value })
      .then((data) => {
        setBuses((prevBuses) =>
          prevBuses.map((bus) => (bus._id === id ? data : bus))
        );
        setEditingBus({ id: null, value: "" });
      })
      .catch((error) => console.error("Error updating bus:", error));
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 bg-[#F5F5F5] min-h-screen">
        <Navbar />
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Bus List</h2>
          <input
            type="text"
            value={newBus}
            onChange={(e) => setNewBus(e.target.value)}
            placeholder="Enter new bus number"
            className="p-2 border border-gray-300 rounded"
          />
          <button
            onClick={handleAddBus}
            disabled={!newBus.trim()}
            className="ml-2 p-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
          >
            Add Bus
          </button>

          <ul className="mt-4">
            {Array.isArray(buses) &&
              buses.map((bus) => (
                <li
                  key={bus._id}
                  className="flex items-center justify-between mb-2"
                >
                  {editingBus.id === bus._id ? (
                    <>
                      <input
                        type="text"
                        value={editingBus.value}
                        onChange={(e) =>
                          setEditingBus({
                            ...editingBus,
                            value: e.target.value,
                          })
                        }
                        className="p-2 border border-gray-300 rounded"
                      />
                      <button
                        onClick={() => handleUpdateBus(bus._id)}
                        disabled={
                          !editingBus.value.trim() ||
                          editingBus.value === bus.busNumber
                        }
                        className="ml-2 p-2 bg-green-500 text-white rounded disabled:bg-gray-300"
                      >
                        Save
                      </button>
                    </>
                  ) : (
                    <>
                      <span>{bus._id}</span>
                      <span>{bus.busNumber}</span>
                      <span>{bus.busId}</span>
                      <span>{bus.busType}</span>
                      <span>{bus.capacity}</span>
                      <span>{bus.status}</span>
                      <span>{bus.price}</span>
                      <div>
                        <button
                          onClick={() => handleEditBus(bus._id)}
                          className="ml-2 p-1 bg-yellow-500 text-white rounded"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteBus(bus._id)}
                          className="ml-2 p-1 bg-red-500 text-white rounded"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default BusList;
