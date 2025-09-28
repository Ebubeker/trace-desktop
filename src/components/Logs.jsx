import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  fetchProcessedTasks,
  formatTaskDuration,
  getProcessedTaskStatusColor
} from '../lib/analysis';

export function Logs({ limit = 50, userId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedTask, setExpandedTask] = useState(null);
  const { user } = useAuth();

  const fetchTasks = useCallback(async () => {
    const targetUserId = userId || user?.id;
    if (!targetUserId) return;

    setLoading(true);
    setError(null);

    try {
      const tasksResponse = await fetchProcessedTasks(targetUserId, limit);
      setTasks(tasksResponse.tasks.tasks);
    } catch (err) {
      setError(err.message || 'Failed to load processed tasks');
    } finally {
      setLoading(false);
    }
  }, [userId, user?.id, limit]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    const targetUserId = userId || user?.id;
    if (!targetUserId) return;

    const interval = setInterval(() => {
      fetchTasks();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchTasks, userId, user?.id]);

  const toggleTaskDetails = (taskId) => {
    setExpandedTask(expandedTask === taskId ? null : taskId);
  };

  const formatTaskEntry = (task) => {
    const startTime = new Date(task.start_time).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const isExpanded = expandedTask === task.id;
    const duration = formatTaskDuration(task.duration_minutes);
    const statusColor = getProcessedTaskStatusColor(task.status);

    const [shortDesc, bullets, conclusion] = task && task.log_pretty_desc ? task.log_pretty_desc.split("\n\n") : [];

    
    const newBullet = bullets ? (bullets.includes("*") ? "*" : "-") : "-";

    const bulletLines = bullets ? bullets
      .split("\n")
      .filter(line => line.startsWith(newBullet))
      .map(line => line.replace(newBullet, "")) : [];

    return (
      <div key={task.id} className="mb-1">
        <div
          className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors"
          onClick={() => toggleTaskDetails(task.id)}
        >
          <span className='font-[500] text-blue-600'>
            {startTime}
          </span>
          <span className="text-gray-700"> – User {task.task_title};</span>
        </div>

        {isExpanded && task.log_pretty_desc && (
          <div className="ml-6 mt-2 mb-3 p-3 bg-white rounded-md border border-gray-200">
            <div className="space-y-6 p-4 bg-white rounded-2xl shadow-md">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">Objective</h3>
                <p className="text-gray-600">
                  {shortDesc.replace("Objective:", "").trim()}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Actions taken</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  {bulletLines.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">Results</h3>
                <p className="text-gray-600">
                  {conclusion.replace("Results:", "").trim()}
                </p>
              </div>
            </div>
            {/* {task.log_pretty_desc} */}
            {/* <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                {task.status}
              </span>
              <span className="text-sm text-gray-500">
                Duration: {duration}
              </span>
              {task.end_time && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm text-gray-500">
                    Ended: {new Date(task.end_time).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </span>
                </>
              )}
            </div>

            {userId && (
              <div className="mb-2">
                <div className="font-medium text-gray-800 text-sm mb-1">User ID:</div>
                <div className="text-gray-600 text-xs font-mono">{task.user_id}</div>
              </div>
            )}

            <div className="mb-2">
              <div className="font-medium text-gray-800 text-sm mb-1">Task:</div>
              <div className="text-gray-700 text-sm">{task.task_title}</div>
            </div>

            <div className="mb-3">
              <div className="font-medium text-gray-800 text-sm mb-1">Description:</div>
              <div className="text-gray-600 text-sm">{task.task_description}</div>
            </div>

            {task.activity_summaries && task.activity_summaries.length > 0 && (
              <div>
                <div className="font-medium text-gray-800 text-sm mb-2">Activity Details:</div>
                <div className="space-y-1">
                  {task.activity_summaries.map((summary, index) => (
                    <div key={index} className="text-xs text-gray-600 pl-2 border-l-2 border-gray-100">
                      <span className="font-mono text-gray-500">{summary.time}</span>
                      <span className="ml-2 font-medium">{summary.title}</span>
                      <div className="ml-4 text-gray-500">{summary.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )} */}
          </div>
        )}
      </div>
    );
  };

  const targetUserId = userId || user?.id;
  if (!targetUserId) {
    return (
      <div className="w-full text-center text-gray-500 py-8">
        Please log in to view processed tasks
      </div>
    );
  }

  return (
    <div className="w-full relative my-6">
      <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-gray-50 to-transparent z-10 pointer-events-none"></div>

      <div className="bg-gray-50 text-black font-sans text-sm h-[650px] overflow-y-auto px-4 py-8" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>

        <div className="mb-4">
          <div className="text-lg font-medium text-gray-800 mb-2">
            Processed Activity Logs
            {userId && <span className="text-sm font-normal text-gray-500"> - User: {userId.substring(0, 8)}...</span>}
          </div>
          <div className="text-xs text-gray-500">Updates every 10 seconds • Click any log to see details</div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <span>Loading processed tasks...</span>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-4">
            Error: {error}
            <button
              onClick={fetchTasks}
              className="ml-2 text-blue-500 underline"
            >
              Retry
            </button>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            <div className="mb-2">No processed tasks yet</div>
            <div className="text-xs">
              {userId
                ? "This user hasn't started tracking or no context switches detected yet"
                : "Start tracking - tasks will appear here when context switches are detected"
              }
            </div>
          </div>
        ) : (
          <div className="space-y-0">
            {tasks.map((task) => formatTaskEntry(task))}
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-50 to-transparent z-10 pointer-events-none"></div>
    </div>
  );
}