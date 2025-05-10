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
  viewMode = "list",
}) => {
  const setRouteStops = useRouteStore((state) => state.setRouteStops);

  // Configure sensors with optimized settings for smoother interaction
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Reduced for more responsive drag initiation
        tolerance: 3, // Lower tolerance for more precise control
        delay: 0, // No delay for immediate response
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 30, // Reduced delay for faster touch response
        tolerance: 5, // Balanced tolerance for touch control
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

      // Optimistic update for immediate UI feedback
      const reordered = arrayMove([...stops], oldIndex, newIndex);
      const updatedStops = reordered.map((stop, idx) => ({
        ...stop,
        order: idx + 1,
      }));

      // Update UI immediately for smooth transition
      setRouteStops(updatedStops);

      // Prepare stops data for API
      const stopsForApi = updatedStops.map((stop) => ({
        stopId: stop.stop?._id || stop._id,
        order: stop.order,
      }));

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
        <div
          className={`${
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              : "space-y-3"
          }`}
        >
          {stops.map((stop) => (
            <SortableStopItem
              key={stop.stop?._id || stop._id}
              stop={stop}
              onEdit={onEdit}
              onDelete={onDelete}
              viewMode={viewMode}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default SortableRouteStops;