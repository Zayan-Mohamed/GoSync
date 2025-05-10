import React, { useEffect, useState } from "react";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveBar } from "@nivo/bar";
import { getBuses } from "../services/busService";
import { getBusOperators } from "../services/busOperatorService";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const BusAnalytics = () => {
  const [buses, setBuses] = useState([]);
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const busData = await getBuses();
        const operatorData = await getBusOperators();

        setBuses(busData || []);
        setOperators(operatorData || []);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const totalBuses = buses.length;

  const activeBuses = buses.filter(
    (bus) => bus.status?.toLowerCase() === "active"
  ).length;

  const inactiveBuses = totalBuses - activeBuses;

  const assignedBuses = buses.filter((bus) => bus.operatorId).length;
  const unassignedBuses = totalBuses - assignedBuses;

  const totalOperators = operators.length;

  // Weekly/Monthly analytics data (dummy data here, replace it with actual logic)
  const weeklyActiveBuses = activeBuses; // Replace with actual weekly data
  const weeklyAssignedBuses = assignedBuses; // Replace with actual weekly data
  const monthlyActiveBuses = activeBuses; // Replace with actual monthly data
  const monthlyAssignedBuses = assignedBuses; // Replace with actual monthly data

  const pieData = [
    { id: "Active", label: "Active", value: activeBuses },
    { id: "Inactive", label: "Inactive", value: inactiveBuses },
  ];

  const barData = [
    {
      type: "Assignment",
      Assigned: assignedBuses,
      Unassigned: unassignedBuses,
    },
  ];

  const weeklyBarData = [
    {
      type: "Weekly Assignment",
      Assigned: weeklyAssignedBuses,
      Unassigned: totalBuses - weeklyAssignedBuses,
    },
  ];

  const monthlyBarData = [
    {
      type: "Monthly Assignment",
      Assigned: monthlyAssignedBuses,
      Unassigned: totalBuses - monthlyAssignedBuses,
    },
  ];

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 bg-[#F5F5F5] min-h-screen">
        <Navbar />
        <div className="p-6 space-y-8">
          <h2 className="text-2xl font-bold">Bus Analytics Dashboard</h2>

          {loading ? (
            <p>Loading analytics...</p>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white shadow rounded p-4 text-center">
                  <h3 className="text-lg font-semibold">Total Buses</h3>
                  <p className="text-2xl">{totalBuses}</p>
                </div>
                <div className="bg-green-100 text-green-800 shadow rounded p-4 text-center">
                  <h3 className="text-lg font-semibold">Active</h3>
                  <p className="text-2xl">{activeBuses}</p>
                </div>
                <div className="bg-red-100 text-red-800 shadow rounded p-4 text-center">
                  <h3 className="text-lg font-semibold">Inactive</h3>
                  <p className="text-2xl">{inactiveBuses}</p>
                </div>
                <div className="bg-blue-100 text-blue-800 shadow rounded p-4 text-center">
                  <h3 className="text-lg font-semibold">Operators</h3>
                  <p className="text-2xl">{totalOperators}</p>
                </div>
                <div className="bg-yellow-100 text-yellow-800 shadow rounded p-4 text-center">
                  <h3 className="text-lg font-semibold">Assigned</h3>
                  <p className="text-2xl">{assignedBuses}</p>
                </div>
                <div className="bg-gray-100 text-gray-800 shadow rounded p-4 text-center">
                  <h3 className="text-lg font-semibold">Unassigned</h3>
                  <p className="text-2xl">{unassignedBuses}</p>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                {/* Active vs Inactive Buses Chart */}
                <div className="h-96 bg-white shadow rounded p-4">
                  <h4 className="text-center mb-4 font-semibold">
                    Active vs Inactive Buses
                  </h4>
                  <ResponsivePie
                    data={pieData}
                    margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                    innerRadius={0.5}
                    padAngle={0.7}
                    cornerRadius={3}
                    activeOuterRadiusOffset={8}
                    colors={{ scheme: "paired" }}
                    borderWidth={1}
                    borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
                    arcLinkLabelsSkipAngle={10}
                    arcLinkLabelsTextColor="#333333"
                    arcLinkLabelsThickness={2}
                    arcLinkLabelsColor={{ from: "color" }}
                    arcLabelsSkipAngle={10}
                    arcLabelsTextColor={{
                      from: "color",
                      modifiers: [["darker", 2]],
                    }}
                  />
                </div>

                {/* Assigned vs Unassigned Buses Chart */}
                <div className="h-96 bg-white shadow rounded p-4">
                  <h4 className="text-center mb-4 font-semibold">
                    Assigned vs Unassigned Buses
                  </h4>
                  <ResponsiveBar
                    data={barData}
                    keys={["Assigned", "Unassigned"]}
                    indexBy="type"
                    margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
                    padding={0.3}
                    colors={{ scheme: "set2" }}
                    axisBottom={{ tickRotation: 0 }}
                    axisLeft={{ tickSize: 5, tickPadding: 5 }}
                    labelSkipWidth={12}
                    labelSkipHeight={12}
                    labelTextColor={{
                      from: "color",
                      modifiers: [["darker", 1.6]],
                    }}
                    animate={true}
                  />
                </div>
              </div>

              {/* Weekly Analytics Chart */}
              <div className="h-96 bg-white shadow rounded p-4 mt-8">
                <h4 className="text-center mb-4 font-semibold">Weekly Bus Assignment</h4>
                <ResponsiveBar
                  data={weeklyBarData}
                  keys={["Assigned", "Unassigned"]}
                  indexBy="type"
                  margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
                  padding={0.3}
                  colors={{ scheme: "set3" }}
                  axisBottom={{ tickRotation: 0 }}
                  axisLeft={{ tickSize: 5, tickPadding: 5 }}
                  labelSkipWidth={12}
                  labelSkipHeight={12}
                  labelTextColor={{
                    from: "color",
                    modifiers: [["darker", 1.6]],
                  }}
                  animate={true}
                />
              </div>

              {/* Monthly Analytics Chart */}
              <div className="h-96 bg-white shadow rounded p-4 mt-8">
                <h4 className="text-center mb-4 font-semibold">Monthly Bus Assignment</h4>
                <ResponsiveBar
                  data={monthlyBarData}
                  keys={["Assigned", "Unassigned"]}
                  indexBy="type"
                  margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
                  padding={0.3}
                  colors={{ scheme: "set3" }}
                  axisBottom={{ tickRotation: 0 }}
                  axisLeft={{ tickSize: 5, tickPadding: 5 }}
                  labelSkipWidth={12}
                  labelSkipHeight={12}
                  labelTextColor={{
                    from: "color",
                    modifiers: [["darker", 1.6]],
                  }}
                  animate={true}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusAnalytics;
