import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import AdminLayout from '../layouts/AdminLayout';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';



const BusAssignmentPage = () => {
    const API_URI = import.meta.env.VITE_API_URL; // Ensure this is set correctly in your .env file
  const [buses, setBuses] = useState([]);  // Ensure buses is always an array
  const [operators, setOperators] = useState([]); // Ensure operators is always an array
  const [loading, setLoading] = useState(false);
  const [selectedBus, setSelectedBus] = useState('');
  const [selectedOperator, setSelectedOperator] = useState('');
  const [viewMode, setViewMode] = useState('unassigned'); // 'unassigned', 'all', 'assigned'

  // Fetch buses based on view mode
  useEffect(() => {
    const fetchBuses = async () => {
      setLoading(true);
      try {
        let response;
        if (viewMode === 'unassigned') {
          response = await axios.get(`${API_URI}/api/buses/unassigned`, {withCredentials: true}); ;
        } else {
          response = await axios.get(`${API_URI}/api/buses/buses`, {withCredentials: true});
        }
        console.log(response.data); // Log to check data structure
        setBuses(response.data);
      } catch (error) {
        console.error('Error fetching buses:', error);
        toast.error('Failed to load buses');
      } finally {
        setLoading(false);
      }
    };

    fetchBuses();
  }, [viewMode]);

  // Fetch operators
  useEffect(() => {
    const fetchOperators = async () => {
      try {
        const response = await axios.get(`${API_URI}/api/operator`, {withCredentials: true});
        setOperators(response.data);
      } catch (error) {
        console.error('Error fetching operators:', error);
        toast.error('Failed to load operators');
      }
    };

    fetchOperators();
  }, []);

  // Handle bus assignment
  const handleAssign = async (e) => {
    e.preventDefault();
    
    if (!selectedBus || !selectedOperator) {
      toast.error('Please select both a bus and an operator');
      return;
    }

    try {
      setLoading(true);
      await axios.put(`${API_URI}/api/operator/assign/${selectedBus}`, {
        operatorId: selectedOperator
      }, { withCredentials: true });
      
      toast.success('Bus assigned successfully');
      
      // Update the bus list without reloading everything
      const updatedBus = buses.map(bus => bus._id === selectedBus ? { ...bus, operator: { operatorName: operators.find(op => op._id === selectedOperator).operatorName } } : bus);
      setBuses(updatedBus);
      
      // Reset selections
      setSelectedBus('');
      setSelectedOperator('');
    } catch (error) {
      console.error('Error assigning bus:', error);
      toast.error('Failed to assign bus to operator');
    } finally {
      setLoading(false);
    }
  };

  // Ensure filteredBuses is always an array
  const filteredBuses = Array.isArray(buses) 
    ? viewMode === 'assigned' 
      ? buses.filter(bus => bus.operator !== null) 
      : buses 
    : [];

    const generatePDF = () => {
      const doc = new jsPDF();
      doc.text('Bus Assignment Report', 14, 15);
      
      const tableColumn = ["Bus Number", "Type", "Travel Name", "Operator", "Status"];
      const tableRows = [];
    
      filteredBuses.forEach((bus) => {
        const busData = [
          bus.busNumber,
          bus.busType,
          bus.travelName,
          bus.operator ? bus.operator.operatorName : "Unassigned",
          bus.status,
        ];
        tableRows.push(busData);
      });
    
      // Use autoTable as a function, not as a method of doc
      autoTable(doc, {
        startY: 20,
        head: [tableColumn],
        body: tableRows,
      });
    
      doc.save("bus_assignment_report.pdf");
    };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Bus Operator Assignment</h1>

        <div className="flex justify-end mb-4">
  <button
    onClick={generatePDF}
    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
  >
    Download PDF
  </button>
</div>

        {/* View Mode Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">View:</label>
          <div className="flex gap-4">
            <button 
              className={`px-4 py-2 rounded ${viewMode === 'unassigned' ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-gray-200'}`}
              onClick={() => setViewMode('unassigned')}
            >
              Unassigned Buses
            </button>
            <button 
              className={`px-4 py-2 rounded ${viewMode === 'assigned' ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-gray-200'}`}
              onClick={() => setViewMode('assigned')}
            >
              Assigned Buses
            </button>
            <button 
              className={`px-4 py-2 rounded ${viewMode === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              onClick={() => setViewMode('all')}
            >
              All Buses
            </button>
          </div>
        </div>

        {/* Assignment Form */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Assign Bus to Operator</h2>
          <form onSubmit={handleAssign}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bus Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Select Bus:</label>
                <select
                  className="w-full p-2 border rounded"
                  value={selectedBus}
                  onChange={(e) => setSelectedBus(e.target.value)}
                  required
                >
                  <option value="">-- Select a Bus --</option>
                  {filteredBuses.map((bus) => (
                    <option key={bus._id} value={bus._id}>
                      {bus.busNumber} - {bus.busType} ({bus.travelName})
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Operator Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Select Operator:</label>
                <select
                  className="w-full p-2 border rounded"
                  value={selectedOperator}
                  onChange={(e) => setSelectedOperator(e.target.value)}
                  required
                >
                  <option value="">-- Select an Operator --</option>
                  {(Array.isArray(operators) ? operators : []).filter(op => op.status === 'Active').map((operator) => (
                    <option key={operator._id} value={operator._id}>
                      {operator.operatorName} ({operator.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <button
              type="submit"
              className="mt-6 px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
              disabled={loading || !selectedBus || !selectedOperator}
            >
              {loading ? 'Processing...' : 'Assign Bus'}
            </button>
          </form>
        </div>

        {/* Bus Assignment List */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Bus Assignments</h2>
          
          {loading ? (
            <p className="text-center py-4">Loading...</p>
          ) : filteredBuses.length === 0 ? (
            <p className="text-center py-4">No buses found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">Bus Number</th>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">Travel Name</th>
                    <th className="px-4 py-2 text-left">Operator</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBuses.map((bus) => (
                    <tr key={bus._id} className="border-b">
                      <td className="px-4 py-2">{bus.busNumber}</td>
                      <td className="px-4 py-2">{bus.busType}</td>
                      <td className="px-4 py-2">{bus.travelName}</td>
                      <td className="px-4 py-2">
                        {bus.operator ? (
                          bus.operator.operatorName
                        ) : (
                          <span className="text-yellow-600">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs ${bus.status === 'Active' ? 'bg-green-100 text-green-800' : bus.status === 'Maintenance' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                          {bus.status}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        {bus.operator ? (
                          <button
                            onClick={() => {
                              setSelectedBus(bus._id);
                              setSelectedOperator('');
                            }}
                            className="text-blue-600 hover:underline"
                          >
                            Reassign
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedBus(bus._id);
                              setSelectedOperator('');
                            }}
                            className="text-green-600 hover:underline"
                          >
                            Assign
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default BusAssignmentPage;



