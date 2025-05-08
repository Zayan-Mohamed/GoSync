import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Pencil, Trash2 } from "lucide-react";

const SortableStopItem = ({ stop, index, onEdit, onDelete }) => {
  // Get the correct ID for the stop
  const stopId = stop.stop?._id || stop._id;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stopId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: "move",
  };

  // Get the stop name, handling different data structures
  const stopName = stop.stopName || stop.stop?.stopName;
  const stopType = stop.stopType || "boarding";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-3 border rounded-lg flex justify-between items-center bg-white shadow-sm ${
        isDragging ? "border-deepOrange" : ""
      }`}
    >
      <div>
        <p className="font-medium">
          {stopName} (Order: {stop.order})
        </p>
        <p className="text-sm text-gray-600">Type: {stopType}</p>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={() => onEdit(stop)}
          className="text-blue-500 hover:text-blue-700"
          title="Edit stop"
        >
          <Pencil size={18} />
        </button>
        <button
          onClick={() => onDelete(stopId)}
          className="text-red-500 hover:text-red-700"
          title="Delete stop"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default SortableStopItem;
