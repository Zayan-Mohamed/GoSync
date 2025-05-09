import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Pencil, Trash2, GripVertical } from "lucide-react";

const SortableStopItem = ({ stop, onEdit, onDelete }) => {
  const stopId = stop.stop?._id || stop._id;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: stopId,
    transition: {
      duration: 200,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)'
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    willChange: 'transform, opacity, box-shadow',
    touchAction: 'none',
    userSelect: 'none'
  };

  const stopName = stop.stopName || stop.stop?.stopName;
  const stopType = stop.stopType || "boarding";
  const isBoarding = stopType.toLowerCase() === "boarding";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`relative group p-4 border rounded-lg flex items-center transition-[background,border-color,box-shadow] duration-200 ease-out transform ${
        isDragging
          ? "border-deepOrange ring-4 ring-orange-400/50 bg-gradient-to-r from-orange-50 to-orange-100 shadow-[0_0_30px_rgba(251,146,60,0.7),0_0_15px_rgba(251,146,60,0.5),inset_0_0_10px_rgba(251,146,60,0.2)] scale-[1.02] z-50 cursor-grabbing"
          : "border-gray-200 bg-white hover:shadow-md hover:border-orange-200 hover:bg-orange-50/10 cursor-grab"
      }`}
    >
      {/* Drag handle with improved visibility */}
      <div
        {...listeners}
        className={`absolute left-2 inset-y-0 flex items-center transition-colors duration-200 ${
          isDragging ? "text-deepOrange" : "text-gray-400 hover:text-gray-600"
        }`}
      >
        <GripVertical size={20} />
      </div>

      {/* Content */}
      <div className="flex-grow ml-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className={`font-medium ${isDragging ? 'text-deepOrange' : 'text-gray-800'}`}>{stopName}</p>
          <span className={`text-sm ${isDragging ? 'text-orange-600' : 'text-gray-500'}`}>Order: {stop.order}</span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium transition-colors duration-200 ${
              isBoarding
                ? "bg-blue-100 text-blue-800"
                : "bg-purple-100 text-purple-800"
            }`}
          >
            {stopType}
          </span>
        </div>

        {/* Actions - Always visible */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(stop)}
            className="p-2 rounded-full text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-colors duration-200"
            title="Edit stop"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => onDelete(stopId)}
            className="p-2 rounded-full text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors duration-200"
            title="Delete stop"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SortableStopItem;
