import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { getSchedulesByDate } from "../services/scheduleService";

const ScheduleSearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const searchDate =
    location.state?.date || new Date().toISOString().split("T")[0];

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const data = await getSchedulesByDate(searchDate);
        setSchedules(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchSchedules();
  }, [searchDate]);

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) return <div>Loading schedules...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 bg-[#F5F5F5] min-h-screen">
        <Navbar />
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              Schedules for {new Date(searchDate).toLocaleDateString()}
            </h2>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Back
            </button>
          </div>

          {schedules.length === 0 ? (
            <div className="text-center py-8">
              <p>No schedules found for this date</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Route
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bus
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Departure
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Arrival
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {schedules.map((schedule) => (
                    <tr key={schedule._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {schedule.routeId?.startLocation} →{" "}
                        {schedule.routeId?.endLocation}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {schedule.busId?.busNumber} ({schedule.busId?.busType})
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(schedule.departureDate).toLocaleDateString()}{" "}
                        at {schedule.departureTime}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(schedule.arrivalDate).toLocaleDateString()} at{" "}
                        {schedule.arrivalTime}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {schedule.duration}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleSearchResults;
