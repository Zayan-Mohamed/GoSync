import React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import SortableStopItem from "./SortableStopItem";
import axios from "axios";
import { toast } from "react-toastify";
import useRouteStore from "../store/routeStore";

const SortableRouteStops = ({
  stops,
  routeId,
  onEdit,
  onDelete,
  onReorderComplete = () => {},
}) => {
  const setRouteStops = useRouteStore((state) => state.setRouteStops);

  // Configure sensors for better interaction across devices
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement required before activation
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // Delay for touch devices
        tolerance: 5, // Tolerance for slight movements
      },
    })
  );

  const handleDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return;

    try {
      // Find the indices based on stop IDs
      const oldIndex = stops.findIndex(
        (s) => (s.stop?._id || s._id) === active.id
      );
      const newIndex = stops.findIndex(
        (s) => (s.stop?._id || s._id) === over.id
      );

      // Reorder the stops array
      const reordered = arrayMove([...stops], oldIndex, newIndex);

      // Update order numbers
      const updatedStops = reordered.map((stop, idx) => ({
        ...stop,
        order: idx + 1,
      }));

      // Update local state immediately for smooth UX
      setRouteStops(updatedStops);

      // Prepare stops data for the API
      const stopsForApi = updatedStops.map((stop) => ({
        stopId: stop.stop?._id || stop._id,
        order: stop.order,
      }));

      // Make API call to update the order
      const API_URI = import.meta.env.VITE_API_URL.replace(/\/$/, "");
      await axios.post(
        `${API_URI}/api/routes/${routeId}/reorder-stops`,
        { stops: stopsForApi }
      );

      toast.success("Stop order updated successfully", {
        position: "top-right",
      });
      onReorderComplete();
    } catch (err) {
      console.error("Failed to reorder stops:", err);
      toast.error("Failed to update stop order. Please try again.", {
        position: "top-right",
      });

      // Revert the changes if the API call fails
      const originalOrder = stops.map((stop, idx) => ({
        ...stop,
        order: idx + 1,
      }));
      setRouteStops(originalOrder);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={stops.map((s) => s.stop?._id || s._id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {stops.map((stop) => (
            <SortableStopItem
              key={stop.stop?._id || stop._id}
              stop={stop}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default SortableRouteStops;