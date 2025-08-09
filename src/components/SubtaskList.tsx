import React, { useState } from 'react';
import { Plus, Check, X, Edit3, Trash2 } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import type { Subtask } from '../types';

interface SubtaskListProps {
  taskId: string;
  subtasks: Subtask[];
}

export const SubtaskList: React.FC<SubtaskListProps> = ({ taskId, subtasks }) => {
  const { addSubtask, toggleSubtask, deleteSubtask, updateSubtask } = useTaskStore();
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [editingSubtask, setEditingSubtask] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);

  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim()) {
      addSubtask(taskId, newSubtaskTitle.trim());
      setNewSubtaskTitle('');
      setShowAddInput(false);
    }
  };

  const handleEditSubtask = (subtask: Subtask) => {
    setEditingSubtask(subtask.id);
    setEditingTitle(subtask.title);
  };

  const handleSaveEdit = (subtaskId: string) => {
    if (editingTitle.trim()) {
      updateSubtask(taskId, subtaskId, editingTitle.trim());
    }
    setEditingSubtask(null);
    setEditingTitle('');
  };

  const handleCancelEdit = () => {
    setEditingSubtask(null);
    setEditingTitle('');
  };

  const completedCount = subtasks.filter(s => s.completed).length;
  const totalCount = subtasks.length;

  return (
    <div className="mt-3 space-y-2">
      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="flex-1 bg-gray-700 rounded-full h-1.5">
            <div 
              className="bg-primary-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
          <span>{completedCount}/{totalCount}</span>
        </div>
      )}

      {/* Subtasks list */}
      <div className="space-y-1 ml-4">
        {subtasks.map((subtask) => (
          <div key={subtask.id} className="flex items-center gap-2 group">
            {/* Checkbox */}
            <button
              onClick={() => toggleSubtask(taskId, subtask.id)}
              className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                subtask.completed 
                  ? 'bg-primary-500 border-primary-500' 
                  : 'border-gray-400 hover:border-primary-400'
              }`}
            >
              {subtask.completed && <Check size={12} className="text-white" />}
            </button>

            {/* Title */}
            {editingSubtask === subtask.id ? (
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit(subtask.id);
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                  className="flex-1 px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-primary-500"
                  autoFocus
                />
                <button
                  onClick={() => handleSaveEdit(subtask.id)}
                  className="p-1 text-green-400 hover:text-green-300"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-1 text-red-400 hover:text-red-300"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <span 
                  className={`flex-1 text-sm ${
                    subtask.completed 
                      ? 'line-through text-gray-500' 
                      : 'text-gray-300'
                  }`}
                >
                  {subtask.title}
                </span>
                
                {/* Actions */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <button
                    onClick={() => handleEditSubtask(subtask)}
                    className="p-1 text-gray-400 hover:text-blue-400"
                  >
                    <Edit3 size={12} />
                  </button>
                  <button
                    onClick={() => deleteSubtask(taskId, subtask.id)}
                    className="p-1 text-gray-400 hover:text-red-400"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {/* Add new subtask */}
        {showAddInput ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-gray-400 rounded"></div>
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddSubtask();
                if (e.key === 'Escape') {
                  setShowAddInput(false);
                  setNewSubtaskTitle('');
                }
              }}
              placeholder="Nuova sottotask..."
              className="flex-1 px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
              autoFocus
            />
            <button
              onClick={handleAddSubtask}
              className="p-1 text-green-400 hover:text-green-300"
            >
              <Check size={14} />
            </button>
            <button
              onClick={() => {
                setShowAddInput(false);
                setNewSubtaskTitle('');
              }}
              className="p-1 text-red-400 hover:text-red-300"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAddInput(true)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-primary-400 transition-colors"
          >
            <Plus size={14} />
            <span>Aggiungi sottotask</span>
          </button>
        )}
      </div>
    </div>
  );
};


