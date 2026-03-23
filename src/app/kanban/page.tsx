'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { io, Socket } from 'socket.io-client';
import api from '@/lib/api';
import { Plus, MoreVertical, Trash2, Calendar, User } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  order: number;
}

const COLUMNS = [
  { id: 'TODO', title: 'To Do', color: 'bg-zinc-500' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-blue-500' },
  { id: 'REVIEW', title: 'Review', color: 'bg-purple-500' },
  { id: 'DONE', title: 'Done', color: 'bg-emerald-500' },
];

let socket: Socket;

export default function KanbanPage() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await api.get('/tasks');
      return res.data.data as Task[];
    },
  });

  useEffect(() => {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000');

    socket.on('task_updated', () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; title?: string; description?: string; status?: string; order?: number }) =>
      api.patch(`/tasks/${data.id}`, data),
    onSuccess: () => {
      setEditingTask(null);
      socket.emit('task_updated');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (tasks: { id: string; order: number; status: string }[]) =>
      api.patch('/tasks/reorder', { tasks }),
    onSuccess: () => {
      socket.emit('task_updated');
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: { title: string; status: string; order: number }) =>
      api.post('/tasks', data),
    onSuccess: () => {
      setIsAdding(null);
      setNewTaskTitle('');
      socket.emit('task_updated');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task created');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: () => {
      socket.emit('task_updated');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task deleted');
    },
  });

  const onDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination || !tasks) return;

      const { source, destination, draggableId } = result;

      if (source.droppableId === destination.droppableId && source.index === destination.index) {
        return;
      }

      const columnTasks = tasks.filter((t) => t.status === destination.droppableId);
      const otherTasks = tasks.filter((t) => t.status !== destination.droppableId && t.id !== draggableId);
      
      const movedTask = tasks.find((t) => t.id === draggableId);
      if (!movedTask) return;

      const newColumnTasks = Array.from(columnTasks.filter(t => t.id !== draggableId));
      newColumnTasks.splice(destination.index, 0, { ...movedTask, status: destination.droppableId });

      const reorderedTasks = [
        ...otherTasks,
        ...newColumnTasks.map((t, index) => ({ ...t, order: index })),
      ];

      queryClient.setQueryData(['tasks'], reorderedTasks);

      if (source.droppableId !== destination.droppableId) {
        updateMutation.mutate({
          id: draggableId,
          status: destination.droppableId,
          order: destination.index,
        });
      } else {
        reorderMutation.mutate(
          newColumnTasks.map((t, index) => ({ id: t.id, order: index, status: t.status }))
        );
      }
    },
    [tasks, queryClient, updateMutation, reorderMutation]
  );

  const getTasksByStatus = (status: string) => {
    return tasks?.filter((t) => t.status === status).sort((a, b) => a.order - b.order) || [];
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Development Kanban</h1>
          <p className="text-sm text-zinc-400">Real-time task synchronization for Shadow Hunters team.</p>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-6 h-full min-w-max">
            {COLUMNS.map((column) => (
              <div key={column.id} className="w-80 flex flex-col bg-zinc-900/40 rounded-2xl border border-zinc-800/50 backdrop-blur-sm">
                <div className="p-4 flex items-center justify-between border-b border-zinc-800/50">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", column.color)} />
                    <h3 className="font-semibold text-zinc-100">{column.title}</h3>
                    <span className="text-xs text-zinc-500 font-mono bg-zinc-800/50 px-2 py-0.5 rounded-full">
                      {getTasksByStatus(column.id).length}
                    </span>
                  </div>
                  <button className="text-zinc-500 hover:text-zinc-300 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={cn(
                        "flex-1 p-4 space-y-3 transition-colors",
                        snapshot.isDraggingOver ? "bg-zinc-800/20" : ""
                      )}
                    >
                      {getTasksByStatus(column.id).map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => {
                            const usePortal = snapshot.isDragging;
                            const child = (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={cn(
                                  "group bg-zinc-950 border border-zinc-800 p-4 rounded-xl shadow-lg transition-all hover:border-zinc-700 cursor-pointer overflow-hidden relative",
                                  snapshot.isDragging ? "shadow-2xl border-indigo-500/50 z-50 px-2" : ""
                                )}
                                style={{
                                  ...provided.draggableProps.style,
                                  // When dragging, we might need to adjust the width if it's in a portal
                                  width: usePortal ? '320px' : undefined,
                                }}
                                onClick={() => {
                                  if (!snapshot.isDragging) {
                                    setEditingTask(task);
                                    setEditTitle(task.title);
                                    setEditDescription(task.description || '');
                                  }
                                }}
                              >
                                {editingTask?.id === task.id ? (
                                  <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                                    <input
                                      autoFocus
                                      className="w-full bg-zinc-900 text-sm text-zinc-100 p-2 rounded border border-zinc-700 focus:outline-none focus:border-indigo-500"
                                      value={editTitle}
                                      onChange={(e) => setEditTitle(e.target.value)}
                                      placeholder="Task title"
                                    />
                                    <textarea
                                      className="w-full bg-zinc-900 text-xs text-zinc-100 p-2 rounded border border-zinc-700 focus:outline-none focus:border-indigo-500 resize-none"
                                      value={editDescription}
                                      onChange={(e) => setEditDescription(e.target.value)}
                                      placeholder="Description (optional)"
                                      rows={2}
                                    />
                                    <div className="flex justify-end gap-2 pt-1 border-t border-zinc-800">
                                      <button
                                        onClick={() => setEditingTask(null)}
                                        className="text-[10px] uppercase font-bold text-zinc-500 hover:text-zinc-300 transition-colors"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={() => updateMutation.mutate({
                                          id: task.id,
                                          title: editTitle,
                                          description: editDescription
                                        })}
                                        className="text-[10px] uppercase font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                                      >
                                        Save
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex justify-between items-start mb-3">
                                      <h4 className="text-sm font-medium text-zinc-100 leading-snug">{task.title}</h4>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteMutation.mutate(task.id);
                                        }}
                                        className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                    
                                    {task.description && (
                                      <p className="text-xs text-zinc-500 mb-4 line-clamp-2">{task.description}</p>
                                    )}

                                    <div className="flex items-center justify-between">
                                      <div className="flex -space-x-2">
                                        <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                                          <User className="w-3 h-3 text-indigo-400" />
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1.5 text-zinc-600">
                                        <Calendar className="w-3 h-3" />
                                        <span className="text-[10px] font-medium uppercase tracking-wider">Today</span>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            );

                            if (usePortal) {
                              return createPortal(child, document.body);
                            }
                            return child;
                          }}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {isAdding === column.id ? (
                        <div className="bg-zinc-950 border border-indigo-500/50 p-3 rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-200">
                          <textarea
                            autoFocus
                            placeholder="What needs to be done?"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (newTaskTitle) {
                                  createMutation.mutate({
                                    title: newTaskTitle,
                                    status: column.id,
                                    order: getTasksByStatus(column.id).length,
                                  });
                                }
                              } else if (e.key === 'Escape') {
                                setIsAdding(null);
                              }
                            }}
                            className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-700 focus:outline-none resize-none mb-2"
                            rows={3}
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setIsAdding(null)}
                              className="text-xs text-zinc-500 hover:text-zinc-300 py-1.5 px-3 rounded-md transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => {
                                if (newTaskTitle) {
                                  createMutation.mutate({
                                    title: newTaskTitle,
                                    status: column.id,
                                    order: getTasksByStatus(column.id).length,
                                  });
                                }
                              }}
                              className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold py-1.5 px-3 rounded-md transition-colors shadow-lg shadow-indigo-500/20"
                            >
                              Add Task
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setIsAdding(column.id)}
                          className="w-full py-2 flex items-center justify-center gap-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30 rounded-lg transition-all border border-transparent hover:border-zinc-800/50"
                        >
                          <Plus className="w-4 h-4" />
                          <span className="text-xs font-medium">New Task</span>
                        </button>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
