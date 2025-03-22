import { useEffect } from "react";
import useRouteStore from "../store/routeStore";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Edit } from "lucide-react";
import { toast } from "react-toastify";

const CurrentRoutes = () => {
  const { routes, fetchRoutes, editRoute, removeRoute, loading, error } = useRouteStore();

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleDelete = async (routeId) => {
    if (window.confirm("Are you sure you want to delete this route?")) {
      try {
        await removeRoute(routeId);
        toast.success("Route deleted successfully!");
      } catch (err) {
        toast.error("Failed to delete route.");
      }
    }
  };

  const handleEdit = async (routeId) => {
    const newRouteName = prompt("Enter new route name:");
    if (newRouteName) {
      try {
        await editRoute(routeId, { name: newRouteName });
        toast.success("Route updated successfully!");
      } catch (err) {
        toast.error("Failed to update route.");
      }
    }
  };

  return (
<div className="flex">
  <Sidebar />
    <div className="flex-1 bg-[#F5F5F5] min-h-screen">
        <Navbar />
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Current Routes</h2>

      {loading && <p>Loading routes...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Route ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {routes.length > 0 ? (
            routes.map((route) => (
              <TableRow key={route._id}>
                <TableCell>{route._id}</TableCell>
                <TableCell>{route.name}</TableCell>
                <TableCell>
                  <Button
                    onClick={() => handleEdit(route._id)}
                    variant="outline"
                    className="mr-2"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(route._id)}
                    variant="destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan="3" className="text-center">
                No routes available.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </div>
    </div>
</div>
  );
};

export default CurrentRoutes;
