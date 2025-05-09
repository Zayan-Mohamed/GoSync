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

  // Configure sensors with optimized settings for smoother interaction
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Reduced from 8 to make it more responsive
        tolerance: 5, // Added tolerance for smoother initiation
        delay: 0, // No delay for immediate response
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 50, // Reduced from 250 for faster touch response
        tolerance: 8, // Increased tolerance for better touch control
      },
    })
  );

  const handleDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return;

    try {
      const oldIndex = stops.findIndex(
        (s) => (s.stop?._id || s._id) === active.id
      );
      const newIndex = stops.findIndex(
        (s) => (s.stop?._id || s._id) === over.id
      );

      const reordered = arrayMove([...stops], oldIndex, newIndex);
      const updatedStops = reordered.map((stop, idx) => ({
        ...stop,
        order: idx + 1,
      }));

      // Optimistically update UI
      setRouteStops(updatedStops);

      // Prepare stops data for API
      const stopsForApi = updatedStops.map((stop) => ({
        stopId: stop.stop?._id || stop._id,
        order: stop.order,
      }));

      // Make API call
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

      // Revert changes if API call fails
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