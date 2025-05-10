import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Pencil, Trash2, GripVertical } from "lucide-react";

const SortableStopItem = ({ stop, onEdit, onDelete, viewMode = 'list' }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: stop.stop?._id || stop._id,
    transition: {
      duration: 400, // Increased for smoother animation
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)'
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    willChange: 'transform, opacity, box-shadow',
    touchAction: 'none',
    userSelect: 'none',
    zIndex: isDragging ? 1000 : 1
  };

  const stopName = stop.stopName || stop.stop?.stopName;
  const isBoarding = stop.stopType === 'boarding';
  const stopType = isBoarding ? 'Boarding' : 'Dropping';

  if (viewMode === 'grid') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`bg-white rounded-lg shadow-sm border transform transition-all duration-300 ease-out
          ${isDragging 
            ? 'border-deepOrange shadow-lg scale-105 rotate-1 shadow-orange-200/50' 
            : 'border-gray-200 hover:shadow-md hover:border-orange-200 hover:scale-102'
          } ${isBoarding ? 'hover:shadow-blue-200/50' : 'hover:shadow-purple-200/50'}`}
      >
        <div className="flex items-center justify-between p-3 bg-gray-50 border-b rounded-t-lg">
          <div
            {...attributes}
            {...listeners}
            className={`cursor-grab active:cursor-grabbing transition-colors duration-200 ${
              isDragging ? 'text-deepOrange' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <GripVertical size={20} />
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium transition-all duration-200
            ${isBoarding
              ? 'bg-blue-100 text-blue-800 shadow-sm hover:shadow-blue-200/50'
              : 'bg-purple-100 text-purple-800 shadow-sm hover:shadow-purple-200/50'
            }`}>
            {stopType}
          </span>
        </div>

        <div className="p-4">
          <div className="flex flex-col gap-2">
            <h3 className={`font-medium transition-colors duration-200 ${isDragging ? 'text-deepOrange' : 'text-gray-800'}`}>
              {stopName}
            </h3>
            <p className={`text-sm transition-colors duration-200 ${isDragging ? 'text-orange-600' : 'text-gray-500'}`}>
              Order: {stop.order}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t">
            <button
              onClick={() => onEdit(stop)}
              className="p-2 rounded-full text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 hover:shadow-md hover:shadow-blue-100"
              title="Edit stop"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={() => onDelete(stop.stop?._id || stop._id)}
              className="p-2 rounded-full text-red-500 hover:text-red-700 hover:bg-red-50 transition-all duration-200 hover:shadow-md hover:shadow-red-100"
              title="Delete stop"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // List view with enhanced animations
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg shadow-sm border transform transition-all duration-300 ease-out
        ${isDragging 
          ? 'border-deepOrange shadow-lg scale-102 rotate-0.5 shadow-orange-200/50' 
          : 'border-gray-200 hover:shadow-md hover:border-orange-200'
        } ${isBoarding ? 'hover:shadow-blue-200/50' : 'hover:shadow-purple-200/50'}`}
    >
      <div className="flex items-center p-4 relative">
        <div
          {...attributes}
          {...listeners}
          className={`absolute left-2 inset-y-0 flex items-center cursor-grab active:cursor-grabbing transition-colors duration-200 ${
            isDragging ? 'text-deepOrange' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <GripVertical size={20} />
        </div>

        <div className="flex-grow ml-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <p className={`font-medium transition-colors duration-200 ${isDragging ? 'text-deepOrange' : 'text-gray-800'}`}>
              {stopName}
            </p>
            <span className={`text-sm transition-colors duration-200 ${isDragging ? 'text-orange-600' : 'text-gray-500'}`}>
              Order: {stop.order}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium transition-all duration-200
              ${isBoarding
                ? 'bg-blue-100 text-blue-800 shadow-sm hover:shadow-blue-200/50'
                : 'bg-purple-100 text-purple-800 shadow-sm hover:shadow-purple-200/50'
              }`}>
              {stopType}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(stop)}
              className="p-2 rounded-full text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 hover:shadow-md hover:shadow-blue-100"
              title="Edit stop"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={() => onDelete(stop.stop?._id || stop._id)}
              className="p-2 rounded-full text-red-500 hover:text-red-700 hover:bg-red-50 transition-all duration-200 hover:shadow-md hover:shadow-red-100"
              title="Delete stop"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SortableStopItem;
