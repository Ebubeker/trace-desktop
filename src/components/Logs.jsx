import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  fetchProcessedTasks,
  fetchSubtasks,
  fetchMajorTasks,
  formatTaskDuration,
  getProcessedTaskStatusColor
} from '../lib/analysis';

export function Logs({ limit = 50, userId }) {
  const [tasks, setTasks] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [majorTasks, setMajorTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedTask, setExpandedTask] = useState(null);
  const [expandedSubtask, setExpandedSubtask] = useState(null);
  const [expandedMajorTask, setExpandedMajorTask] = useState(null);
  const [lastNotifiedTaskIds, setLastNotifiedTaskIds] = useState(null);
  const [viewMode, setViewMode] = useState('major-tasks'); // 'major-tasks', 'subtasks', 'processed-logs'
  const { user } = useAuth();

  // Request notification permission on component mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Check for no_focus notifications
  useEffect(() => {
    if (tasks.length >= 2) {
      const lastTwoTasks = tasks.slice(0, 2);
      const bothHaveNoFocus = lastTwoTasks.every(task => task.no_focus === true);
      
      if (bothHaveNoFocus) {
        const currentTaskIds = lastTwoTasks.map(task => task.id).sort().join('-');
        
        if (lastNotifiedTaskIds !== currentTaskIds) {
          showNoFocusNotification();
          setLastNotifiedTaskIds(currentTaskIds);
        }
      }
    }
  }, [tasks, lastNotifiedTaskIds]);

  const showNoFocusNotification = () => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          const notification = new Notification('Focus Alert', {
            body: 'You seem to be losing focus. The last 2 activities show no focus detected.',
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'no-focus-alert',
            requireInteraction: true,
          });

          setTimeout(() => {
            notification.close();
          }, 10000);

          notification.onclick = () => {
            window.focus();
            notification.close();
          };
        } catch (error) {
          console.error('Failed to show desktop notification:', error);
        }
      }
    }
  };

  const fetchAllData = useCallback(async () => {
    const targetUserId = userId || user?.id;
    if (!targetUserId) return;

    setLoading(true);
    setError(null);

    try {
      const [tasksResponse, subtasksResponse, majorTasksResponse] = await Promise.all([
        fetchProcessedTasks(targetUserId, limit),
        fetchSubtasks(targetUserId),
        fetchMajorTasks(targetUserId)
      ]);
      
      setTasks(tasksResponse.tasks.tasks);
      setSubtasks(subtasksResponse.subtasks || []);
      setMajorTasks(majorTasksResponse.majorTasks || []);
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [userId, user?.id, limit]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    const targetUserId = userId || user?.id;
    if (!targetUserId) return;

    const interval = setInterval(() => {
      fetchAllData();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchAllData, userId, user?.id]);

  const toggleTaskDetails = (taskId) => {
    setExpandedTask(expandedTask === taskId ? null : taskId);
  };

  const toggleSubtaskDetails = (subtaskId) => {
    setExpandedSubtask(expandedSubtask === subtaskId ? null : subtaskId);
  };

  const toggleMajorTaskDetails = (majorTaskId) => {
    setExpandedMajorTask(expandedMajorTask === majorTaskId ? null : majorTaskId);
  };

  // Get processed log by ID
  const getProcessedLogById = (id) => {
    return tasks.find(task => task.id === parseInt(id));
  };

  // Get subtask by ID
  const getSubtaskById = (id) => {
    return subtasks.find(subtask => subtask.id === parseInt(id));
  };

  const formatProcessedLogEntry = (task, isNested = false) => {
    if (!task) return null;

    const startTime = new Date(task.start_time).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const isExpanded = expandedTask === task.id;
    const hasNoFocus = task.no_focus === true;

    const [shortDesc, bullets, conclusion] = task && task.log_pretty_desc ? task.log_pretty_desc.split("\n\n") : [];
    const newBullet = bullets ? (bullets.includes("*") ? "*" : "-") : "-";
    const bulletLines = bullets ? bullets
      .split("\n")
      .filter(line => line.startsWith(newBullet))
      .map(line => line.replace(newBullet, "")) : [];

    return (
      <div key={task.id} className={`mb-1 ${isNested ? 'ml-8' : ''}`}>
        <div
          className={`cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors ${
            hasNoFocus ? 'border-l-4 border-red-400 bg-red-50' : ''
          }`}
          onClick={() => toggleTaskDetails(task.id)}
        >
          <span className='font-[500] text-blue-600'>
            {startTime}
          </span>
          <span className="text-gray-700"> – User {task.task_title};</span>
          {hasNoFocus && (
            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              🔴 No Focus
            </span>
          )}
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
          </div>
        )}
      </div>
    );
  };

  const formatSubtaskEntry = (subtask, isNested = false) => {
    const isExpanded = expandedSubtask === subtask.id;
    const processedLogs = subtask.personalized_task_ids.map(id => getProcessedLogById(id)).filter(Boolean);

    return (
      <div key={subtask.id} className={`mb-2 ${isNested ? 'ml-6 border-l-2 border-purple-200 pl-3' : ''}`}>
        <div
          className="cursor-pointer hover:bg-purple-50 px-3 py-2 rounded transition-colors border-l-4 border-purple-400 bg-purple-50/30"
          onClick={() => toggleSubtaskDetails(subtask.id)}
        >
          <div className="flex items-start gap-2">
            <span className="text-purple-700 font-medium text-sm">
              {isExpanded ? '▼' : '▶'}
            </span>
            <div className="flex-1">
              <div className="font-semibold text-purple-900">{subtask.subtask_name}</div>
              <div className="text-xs text-purple-700 mt-1">{subtask.subtask_summary}</div>
              <div className="text-xs text-gray-500 mt-1">
                {subtask.personalized_task_ids.length} processed log{subtask.personalized_task_ids.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-2 space-y-1">
            {processedLogs.length > 0 ? (
              processedLogs.map(log => formatProcessedLogEntry(log, true))
            ) : (
              <div className="ml-8 text-sm text-gray-500 py-2">No processed logs found</div>
            )}
          </div>
        )}
      </div>
    );
  };

  const formatMajorTaskEntry = (majorTask) => {
    const isExpanded = expandedMajorTask === majorTask.id;
    const relatedSubtasks = majorTask.subtask_ids.map(id => getSubtaskById(id)).filter(Boolean);

    return (
      <div key={majorTask.id} className="mb-3">
        <div
          className="cursor-pointer hover:bg-blue-50 px-4 py-3 rounded-lg transition-colors border-l-4 border-blue-500 bg-blue-50/50"
          onClick={() => toggleMajorTaskDetails(majorTask.id)}
        >
          <div className="flex items-start gap-2">
            <span className="text-blue-700 font-bold text-base">
              {isExpanded ? '▼' : '▶'}
            </span>
            <div className="flex-1">
              <div className="font-bold text-blue-900 text-base">{majorTask.major_task_title}</div>
              <div className="mt-2 space-y-1">
                {majorTask.major_task_summary.map((summary, idx) => (
                  <div key={idx} className="text-sm text-blue-800">• {summary}</div>
                ))}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {majorTask.subtask_ids.length} subtask{majorTask.subtask_ids.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-2 space-y-2">
            {relatedSubtasks.length > 0 ? (
              relatedSubtasks.map(subtask => formatSubtaskEntry(subtask, true))
            ) : (
              <div className="ml-6 text-sm text-gray-500 py-2">No subtasks found</div>
            )}
          </div>
        )}
      </div>
    );
  };

  const targetUserId = userId || user?.id;
  if (!targetUserId) {
    return (
      <div className="w-full text-center text-gray-500 py-8">
        Please log in to view activity data
      </div>
    );
  }

  return (
    <div className="w-full relative my-6">
      <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-gray-50 to-transparent z-10 pointer-events-none"></div>

      <div className="bg-gray-50 text-black font-sans text-sm h-[650px] overflow-y-auto px-4 py-8" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>

        {/* View Mode Tabs */}
        <div className="mb-4">
          <div className="flex gap-2 mb-3 border-b border-gray-200">
            <button
              onClick={() => setViewMode('major-tasks')}
              className={`px-4 py-2 font-medium transition-colors ${
                viewMode === 'major-tasks'
                  ? 'text-blue-700 border-b-2 border-blue-700 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Major Tasks ({majorTasks.length})
            </button>
            <button
              onClick={() => setViewMode('subtasks')}
              className={`px-4 py-2 font-medium transition-colors ${
                viewMode === 'subtasks'
                  ? 'text-purple-700 border-b-2 border-purple-700 bg-purple-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Subtasks ({subtasks.length})
            </button>
            <button
              onClick={() => setViewMode('processed-logs')}
              className={`px-4 py-2 font-medium transition-colors ${
                viewMode === 'processed-logs'
                  ? 'text-green-700 border-b-2 border-green-700 bg-green-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Processed Logs ({tasks.length})
            </button>
          </div>

          <div className="text-lg font-medium text-gray-800 mb-2">
            {viewMode === 'major-tasks' && 'Major Tasks Overview'}
            {viewMode === 'subtasks' && 'Subtasks Overview'}
            {viewMode === 'processed-logs' && 'Processed Activity Logs'}
            {userId && <span className="text-sm font-normal text-gray-500"> - User: {userId.substring(0, 8)}...</span>}
          </div>
          <div className="text-xs text-gray-500">
            Updates every 10 seconds • Click to expand and see details
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <span>Loading data...</span>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-4">
            Error: {error}
            <button
              onClick={fetchAllData}
              className="ml-2 text-blue-500 underline"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-0">
            {viewMode === 'major-tasks' && (
              majorTasks.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  <div className="mb-2">No major tasks yet</div>
                  <div className="text-xs">Major tasks will appear here as the system processes your activities</div>
                </div>
              ) : (
                majorTasks.map(majorTask => formatMajorTaskEntry(majorTask))
              )
            )}

            {viewMode === 'subtasks' && (
              subtasks.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  <div className="mb-2">No subtasks yet</div>
                  <div className="text-xs">Subtasks will appear here as the system processes your activities</div>
                </div>
              ) : (
                subtasks.map(subtask => formatSubtaskEntry(subtask, false))
              )
            )}

            {viewMode === 'processed-logs' && (
              tasks.length === 0 ? (
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
                tasks.map(task => formatProcessedLogEntry(task, false))
              )
            )}
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-50 to-transparent z-10 pointer-events-none"></div>
    </div>
  );
}