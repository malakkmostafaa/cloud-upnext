import { X } from "lucide-react";

function TaskDetailModal({ task, onClose }) {
  if (!task) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-[700px] rounded-3xl p-6 relative shadow-2xl">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4"
        >
          <X size={24} />
        </button>

        <h2 className="text-3xl font-bold mb-4">
          {task.title}
        </h2>

        <p className="text-gray-600 mb-6">
          {task.description}
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          
          <div className="bg-gray-100 p-4 rounded-2xl">
            <p className="text-sm text-gray-500">
              Status
            </p>

            <p className="font-bold">
              {task.status}
            </p>
          </div>

          <div className="bg-gray-100 p-4 rounded-2xl">
            <p className="text-sm text-gray-500">
              Priority
            </p>

            <p className="font-bold">
              {task.priority}
            </p>
          </div>

          <div className="bg-gray-100 p-4 rounded-2xl">
            <p className="text-sm text-gray-500">
              Assignee
            </p>

            <p className="font-bold">
              {task.assigneeName}
            </p>
          </div>

          <div className="bg-gray-100 p-4 rounded-2xl">
            <p className="text-sm text-gray-500">
              Team
            </p>

            <p className="font-bold">
              {task.teamName}
            </p>
          </div>

        </div>

        <div className="bg-blue-50 p-4 rounded-2xl mb-6">
          <p className="text-sm text-gray-500">
            Deadline
          </p>

          <p className="font-bold">
            {task.deadline}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6">

          <div className="bg-gray-100 rounded-2xl p-4 min-h-[200px]">
            <h3 className="font-bold mb-3">
              Comments
            </h3>

            <p className="text-gray-500 text-sm">
              Comments coming soon...
            </p>
          </div>

          <div className="bg-gray-100 rounded-2xl p-4 min-h-[200px]">
            <h3 className="font-bold mb-3">
              Attachments
            </h3>

            <p className="text-gray-500 text-sm">
              Image upload coming soon...
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default TaskDetailModal;