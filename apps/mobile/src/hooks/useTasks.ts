import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getTasksForDate, 
  getCarriedTasks, 
  createTask, 
  updateTask, 
  deleteTask, 
  completeTask, 
  startTask, 
  cancelTask, 
  carryTask 
} from '../services/data';
import { Task } from '../types/firestore';

export function useTasksQuery(userId: string | null, date: Date) {
  return useQuery({
    queryKey: ['tasks', userId, date.toISOString().split('T')[0]],
    queryFn: () => userId ? getTasksForDate(userId, date) : Promise.resolve([]),
    enabled: !!userId,
  });
}

export function useCarriedTasksQuery(userId: string | null) {
  return useQuery({
    queryKey: ['carriedTasks', userId],
    queryFn: () => userId ? getCarriedTasks(userId) : Promise.resolve([]),
    enabled: !!userId,
  });
}

export function useTasksMutations(userId: string | null) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks', userId] });
    queryClient.invalidateQueries({ queryKey: ['carriedTasks', userId] });
  };

  const add = useMutation({
    mutationFn: (taskData: any) => createTask(taskData),
    onSuccess: invalidate,
  });

  const edit = useMutation({
    mutationFn: ({ taskId, data }: { taskId: string, data: Partial<Task> }) => updateTask(taskId, data),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (taskId: string) => deleteTask(taskId),
    onSuccess: invalidate,
  });

  const markComplete = useMutation({
    mutationFn: ({ taskId, actualMinutes }: { taskId: string, actualMinutes?: number }) => completeTask(taskId, actualMinutes),
    onSuccess: invalidate,
  });

  const carry = useMutation({
    mutationFn: ({ taskId, newDate }: { taskId: string, newDate: Date }) => carryTask(taskId, newDate),
    onSuccess: invalidate,
  });

  return { add, edit, remove, markComplete, carry };
}
