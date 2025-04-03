import React, { useState, useEffect } from "react";
import {
  getSchedules,
  deleteSchedule,
  getSchedulesByDate,
  updateSchedule,
} from "../services/scheduleService";
import { getBuses } from "../services/busService";
import { getRoutes } from "../services/routeService";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  Button,
} from "@mui/material";
import { Edit, Delete, Save } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

function ScheduleList() {
  const [schedules, setSchedules] = useState([]);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [searchDate, setSearchDate] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [editingSchedule, setEditingSchedule] = useState({
    id: null,
    routeId: "",
    busId: "",
    departureTime: "",
    arrivalTime: "",
    departureDate: "",
    arrivalDate: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [schedulesData, busesData, routesData] = await Promise.all([
          getSchedules()
        ]);

        setSchedules(schedulesData);
        setBuses(busesData);
        setRoutes(routesData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDeleteSchedule = async (id) => {
    try {
      await deleteSchedule(id);
      setSchedules((prevSchedules) =>
        prevSchedules.filter((schedule) => schedule._id !== id)
      );
    } catch (error) {
      console.error("Error deleting schedule:", error);
    }
  };

  const handleEditSchedule = (schedule) => {
    setEditingSchedule({
      id: schedule._id,
      routeId: schedule.routeId._id || schedule.routeId,
      busId: schedule.busId._id || schedule.busId,
      departureTime: schedule.departureTime,
      arrivalTime: schedule.arrivalTime,
      departureDate: schedule.departureDate.split("T")[0],
      arrivalDate: schedule.arrivalDate.split("T")[0],
    });
  };

  const handleUpdateSchedule = async () => {
    try {
      const updatedSchedule = await updateSchedule(
        editingSchedule.id,
        editingSchedule
      );
      setSchedules((prevSchedules) =>
        prevSchedules.map((schedule) =>
          schedule._id === editingSchedule.id ? updatedSchedule : schedule
        )
      );
      setEditingSchedule({
        id: null,
        routeId: "",
        busId: "",
        departureTime: "",
        arrivalTime: "",
        departureDate: "",
        arrivalDate: "",
      });
    } catch (error) {
      console.error("Error updating schedule:", error);
    }
  };

  const handleSearch = async () => {
    if (!searchDate) return;
    setLoading(true);
    try {
      const data = await getSchedulesByDate(searchDate);
      setSchedules(data);
    } catch (error) {
      console.error("Error searching schedules:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading schedules...</div>;

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 bg-[#F5F5F5] min-h-screen">
        <Navbar />
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Schedule List</h2>

          {/* Search by Date */}
          <div className="flex mb-4">
            <TextField
              type="date"
              variant="outlined"
              size="small"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="mr-2"
            />
            <Button
              onClick={handleSearch}
              variant="contained"
              color="primary"
              disabled={!searchDate}
            >
              Search
            </Button>
            <Button
              onClick={() => navigate("/insert-schedule")}
              variant="contained"
              color="secondary"
              className="ml-auto"
            >
              Add Schedule
            </Button>
          </div>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Route</TableCell>
                  <TableCell>Bus</TableCell>
                  <TableCell>Departure</TableCell>
                  <TableCell>Arrival</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {schedules.map((schedule) => (
                  <TableRow key={schedule._id}>
                    {/* Route */}
                    <TableCell>
                      {editingSchedule.id === schedule._id ? (
                        <select
                          value={editingSchedule.routeId}
                          onChange={(e) =>
                            setEditingSchedule({
                              ...editingSchedule,
                              routeId: e.target.value,
                            })
                          }
                          className="w-full p-1 border rounded"
                        >
                          {routes.map((route) => (
                            <option key={route._id} value={route._id}>
                              {route.startLocation} → {route.endLocation}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <>
                          {schedule.routeId?.startLocation || ""} →{" "}
                          {schedule.routeId?.endLocation || ""}
                        </>
                      )}
                    </TableCell>

                    {/* Bus */}
                    <TableCell>
                      {editingSchedule.id === schedule._id ? (
                        <select
                          value={editingSchedule.busId}
                          onChange={(e) =>
                            setEditingSchedule({
                              ...editingSchedule,
                              busId: e.target.value,
                            })
                          }
                          className="w-full p-1 border rounded"
                        >
                          {buses.map((bus) => (
                            <option key={bus._id} value={bus._id}>
                              {bus.busNumber} ({bus.busType})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <>
                          {schedule.busId
                            ? `${schedule.busId.busNumber} (${schedule.busId.busType})`
                            : ""}
                        </>
                      )}
                    </TableCell>

                    {/* Departure */}
                    <TableCell>
                      {editingSchedule.id === schedule._id ? (
                        <div className="flex flex-col">
                          <input
                            type="date"
                            value={editingSchedule.departureDate}
                            onChange={(e) =>
                              setEditingSchedule({
                                ...editingSchedule,
                                departureDate: e.target.value,
                              })
                            }
                            className="mb-1 p-1 border rounded"
                          />
                          <input
                            type="time"
                            value={editingSchedule.departureTime}
                            onChange={(e) =>
                              setEditingSchedule({
                                ...editingSchedule,
                                departureTime: e.target.value,
                              })
                            }
                            className="p-1 border rounded"
                          />
                        </div>
                      ) : (
                        `${new Date(schedule.departureDate).toLocaleDateString()} at ${schedule.departureTime}`
                      )}
                    </TableCell>

                    {/* Arrival */}
                    <TableCell>
                      {editingSchedule.id === schedule._id ? (
                        <div className="flex flex-col">
                          <input
                            type="date"
                            value={editingSchedule.arrivalDate}
                            onChange={(e) =>
                              setEditingSchedule({
                                ...editingSchedule,
                                arrivalDate: e.target.value,
                              })
                            }
                            className="mb-1 p-1 border rounded"
                          />
                          <input
                            type="time"
                            value={editingSchedule.arrivalTime}
                            onChange={(e) =>
                              setEditingSchedule({
                                ...editingSchedule,
                                arrivalTime: e.target.value,
                              })
                            }
                            className="p-1 border rounded"
                          />
                        </div>
                      ) : (
                        `${new Date(schedule.arrivalDate).toLocaleDateString()} at ${schedule.arrivalTime}`
                      )}
                    </TableCell>

                    {/* Duration */}
                    <TableCell>{schedule.duration}</TableCell>

                    {/* Actions */}
                    <TableCell>
                      {editingSchedule.id === schedule._id ? (
                        <>
                          <IconButton onClick={handleUpdateSchedule}>
                            <Save color="primary" />
                          </IconButton>
                          <IconButton
                            onClick={() =>
                              setEditingSchedule({
                                id: null,
                                routeId: "",
                                busId: "",
                                departureTime: "",
                                arrivalTime: "",
                                departureDate: "",
                                arrivalDate: "",
                              })
                            }
                          >
                            <Delete color="secondary" />
                          </IconButton>
                        </>
                      ) : (
                        <>
                          <IconButton
                            onClick={() => handleEditSchedule(schedule)}
                          >
                            <Edit color="primary" />
                          </IconButton>
                          <IconButton
                            onClick={() => handleDeleteSchedule(schedule._id)}
                          >
                            <Delete color="secondary" />
                          </IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </div>
    </div>
  );
}

export default ScheduleList;
