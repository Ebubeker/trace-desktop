import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  fetchProcessedTasks,
  fetchSubtasks,
  fetchMajorTasks,
  formatTaskDuration,
  getProcessedTaskStatusColor
} from '../lib/analysis';
import { Calendar } from './ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import { Button } from './ui/button';
import { CalendarIcon, X, Target, Info, ListTodo, ChevronDown, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export function Logs({ limit = 500, userId }) {
  const [tasks, setTasks] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [majorTasks, setMajorTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedTask, setExpandedTask] = useState(null);
  const [expandedSubtask, setExpandedSubtask] = useState(null);
  const [expandedMajorTask, setExpandedMajorTask] = useState(null);
  const [lastNotifiedTaskIds, setLastNotifiedTaskIds] = useState(null);
  const [viewMode, setViewMode] = useState('processed-logs'); // 'task-hierarchy', 'processed-logs'
  const [hierarchyLevel, setHierarchyLevel] = useState('major-tasks'); // 'major-tasks', 'subtasks', 'processed-logs'
  const [selectedMajorTask, setSelectedMajorTask] = useState(null);
  const [selectedSubtask, setSelectedSubtask] = useState(null);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [showFromCalendar, setShowFromCalendar] = useState(false);
  const [showToCalendar, setShowToCalendar] = useState(false);
  const [showMajorTaskModal, setShowMajorTaskModal] = useState(false);
  const [selectedMajorTaskForModal, setSelectedMajorTaskForModal] = useState(null);
  const [showSubtaskModal, setShowSubtaskModal] = useState(false);
  const [selectedSubtaskForModal, setSelectedSubtaskForModal] = useState(null);
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
        fetchProcessedTasks(targetUserId, limit, fromDate, toDate),
        fetchSubtasks(targetUserId, fromDate, toDate),
        fetchMajorTasks(targetUserId, fromDate, toDate)
      ]);

      // Safely extract tasks with proper fallbacks
      setTasks(tasksResponse?.tasks?.tasks || tasksResponse?.tasks || []);
      setSubtasks(subtasksResponse?.subtasks || []);
      setMajorTasks(majorTasksResponse?.majorTasks || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
      // Set empty arrays on error to prevent undefined errors
      setTasks([]);
      setSubtasks([]);
      setMajorTasks([]);
    } finally {
      setLoading(false);
    }
  }, [userId, user?.id, limit, fromDate?.getTime(), toDate?.getTime()]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    const targetUserId = userId || user?.id;
    if (!targetUserId) return;

    const interval = setInterval(() => {
      fetchAllData();
    }, 30000);

    return () => clearInterval(interval);
  }, [userId, user?.id]); // Remove fetchAllData from dependencies to prevent interval recreation

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

  // Format log description with proper structure
  const formatLogDescription = (description) => {
    if (!description) return null;

    // Split by sections (Intent, Actions, Outcome)
    const sections = description.split(/(?=### Intent|### Actions|### Outcome)/);
    
    return (
      <div className="">
        {sections.map((section, index) => {
          if (!section.trim()) return null;
          
          const lines = section.trim().split('\n');
          const title = lines[0];
          const content = lines.slice(1).join('\n').trim();
          
          // Determine section type and styling
          let sectionClass = '';
          let titleClass = '';
          
          if (title.includes('###')) {
            titleClass = 'text-[#111d29] text-md font-semibold';
          }
          
          return (
            <div key={index} className={`p-1 rounded-lg ${sectionClass}`}>
              <div className={`${titleClass}`}>
                {title.replace(/### /g, '')}
              </div>
              <div className="text-sm text-gray-700 leading-relaxed">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const formatProcessedLogEntry = (task, isNested = false) => {
    if (!task) return null;

    // Backend sends UTC timestamps - ensure they're properly treated as UTC
    let timestamp = task.start_time;
    // If no timezone indicator, treat as UTC by adding 'Z'
    if (timestamp && !timestamp.endsWith('Z') && !timestamp.includes('+') && !timestamp.includes('-', 10)) {
      timestamp = timestamp + 'Z';
    }

    const startDate = new Date(timestamp);
    const startTime = startDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    // Also show the date if it's not today
    const today = new Date();
    const isToday = startDate.toDateString() === today.toDateString();
    const dateDisplay = isToday ? '' : startDate.toLocaleDateString([], {
      month: 'short',
      day: 'numeric'
    }) + ' ';

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
          className={`cursor-pointer hover:bg-gray-100 bg-[#96b7d9]/20 px-2 py-1 rounded transition-colors flex items-center justify-between ${hasNoFocus ? 'border-l-4 border-red-400 bg-red-50' : ''
            }`}
          onClick={() => toggleTaskDetails(task.id)}
        >
          <div className="flex items-center">
            <span className='font-[500] text-[#1b3652]'>
              {dateDisplay}{startTime}
            </span>
            <span className="text-gray-700 ml-1">– {task.task_title}</span>
            {hasNoFocus && (
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                🔴 No Focus
              </span>
            )}
          </div>
          <div className="flex items-center">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
          </div>
        </div>

        {isExpanded && (
          <>
            {task.task_description && (
              <div className="text-gray-600 bg-gray-50 p-3 rounded-md prose prose-sm max-w-none">
                {formatLogDescription(task.task_description)}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const formatSubtaskEntry = (subtask, isNested = false, isHierarchical = false) => {
    const isExpanded = expandedSubtask === subtask.id;
    const processedLogs = subtask.personalized_task_ids.map(id => getProcessedLogById(id)).filter(Boolean);

    const handleInfoClick = (e) => {
      e.stopPropagation();
      setSelectedSubtaskForModal(subtask);
      setShowSubtaskModal(true);
    };

    return (
      <div key={subtask.id} className={`mb-3 ${isNested ? 'ml-6' : ''}`}>
        <div
          className="cursor-pointer hover:bg-[#2a3f52] px-5 py-4 rounded-xl transition-all bg-[#3d5266] border border-[#4a6073] shadow-sm hover:shadow-md group h-full"
          onClick={() => {
            if (isHierarchical) {
              setSelectedSubtask(subtask);
              setHierarchyLevel('processed-logs');
            } else {
              toggleSubtaskDetails(subtask.id);
            }
          }}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-start gap-3">
              <ListTodo className="h-5 w-5 text-white/80 group-hover:text-white transition-colors flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white text-base mb-1">{subtask.subtask_name}</div>
                {/* <div className="text-sm text-white/70 leading-relaxed">{subtask.subtask_summary}</div> */}
              </div>
            </div>
            <div className="flex items-center gap-2.5 flex-shrink-0 mt-0.5">
              <button
                onClick={handleInfoClick}
                className="p-1 rounded-full hover:bg-[#2a3f52] transition-colors flex items-center justify-center"
                title="View details"
              >
                <Info className="h-[18px] w-[18px] text-white/80 hover:text-white transition-colors" />
              </button>
              <div className='w-[85px] flex justify-end'>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#2a3f52] rounded-full">
                  <span className="text-xs font-medium text-white/90">
                    {subtask.personalized_task_ids.length} log{subtask.personalized_task_ids.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <span className="text-white/80 font-bold text-base group-hover:text-white transition-colors flex items-center justify-center w-5 h-5">
                {isHierarchical ? '▶' : (isExpanded ? '▼' : '▶')}
              </span>
            </div>
          </div>
        </div>

        {isExpanded && !isHierarchical && (
          <div className="mt-2">
            {processedLogs.length > 0 ? (
              <div className="flex flex-col gap-4">
                {processedLogs.map(log => formatProcessedLogEntry(log, true))}
              </div>
            ) : (
              <div className="ml-8 text-sm text-gray-500 py-2">No processed logs found</div>
            )}
          </div>
        )}
      </div>
    );
  };

  const formatMajorTaskEntry = (majorTask, isHierarchical = false) => {
    const isExpanded = expandedMajorTask === majorTask.id;
    const relatedSubtasks = majorTask.subtask_ids.map(id => getSubtaskById(id)).filter(Boolean);

    const handleInfoClick = (e) => {
      e.stopPropagation();
      setSelectedMajorTaskForModal(majorTask);
      setShowMajorTaskModal(true);
    };

    return (
      <div key={majorTask.id} >
        <div
          className="cursor-pointer hover:bg-[#1a2936] px-5 py-4 rounded-xl transition-all bg-[#111d29] shadow-md hover:shadow-lg group"
          onClick={() => {
            if (isHierarchical) {
              setSelectedMajorTask(majorTask);
              setHierarchyLevel('subtasks');
            } else {
              toggleMajorTaskDetails(majorTask.id);
            }
          }}
        >
          <div className="flex items-center gap-3">
            <Target className="h-5 w-5 text-gray-300 group-hover:text-white transition-colors flex-shrink-0" />
            <div className="flex-1">
              <div className="font-semibold text-white text-base">{majorTask.major_task_title}</div>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleInfoClick}
                className="p-1 rounded-full hover:bg-[#1a2936] transition-colors flex items-center justify-center"
                title="View details"
              >
                <Info className="h-[18px] w-[18px] text-gray-300 hover:text-white transition-colors" />
              </button>
              <div className='w-[85px] flex justify-end'>

                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#1a2936] rounded-full">
                  <span className="text-xs font-medium text-gray-300">
                    {majorTask.subtask_ids.length} subtask{majorTask.subtask_ids.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <span className="text-gray-300 font-bold text-base group-hover:text-white transition-colors flex items-center justify-center w-5">
                {isHierarchical ? '▶' : (isExpanded ? '▼' : '▶')}
              </span>
            </div>
          </div>
        </div>

        {isExpanded && !isHierarchical && (
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
    <div className="w-full relative bg-white border border-gray-200/30 rounded-lg shadow-sm">
      <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none"></div>

      <div className="bg-white text-black font-sans text-sm h-[calc(100vh-240px)] overflow-y-auto px-4 py-8" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>

        {/* View Mode Tabs */}
        <div className="mb-4">
          {/* Date Filter */}
          <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-700">Filter by date:</span>

            {/* From Date */}
            <Popover>
              <PopoverTrigger>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFromCalendar(!showFromCalendar)}
                  className="h-9 px-3 text-sm border-gray-300"
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {fromDate
                    ? `${fromDate.toLocaleDateString()} ${fromDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : 'From date & time'}
                </Button>
              </PopoverTrigger>
              {showFromCalendar && (
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar
                    selected={fromDate}
                    showTimeSelect={true}
                    onSelect={(date) => {
                      setFromDate(date);
                      setShowFromCalendar(false);
                    }}
                  />
                </PopoverContent>
              )}
            </Popover>

            {/* To Date */}
            <Popover>
              <PopoverTrigger>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowToCalendar(!showToCalendar)}
                  className="h-9 px-3 text-sm border-gray-300"
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {toDate
                    ? `${toDate.toLocaleDateString()} ${toDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : 'To date & time'}
                </Button>
              </PopoverTrigger>
              {showToCalendar && (
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar
                    selected={toDate}
                    showTimeSelect={true}
                    onSelect={(date) => {
                      setToDate(date);
                      setShowToCalendar(false);
                    }}
                  />
                </PopoverContent>
              )}
            </Popover>

            {/* Clear Filters */}
            {(fromDate || toDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFromDate(null);
                  setToDate(null);
                }}
                className="h-9 px-3 text-sm text-gray-600 hover:text-gray-900"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}

            {/* Quick filters */}
            <div className="flex gap-2 ml-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const endOfToday = new Date();
                  endOfToday.setHours(23, 59, 59, 999);
                  setFromDate(today);
                  setToDate(endOfToday);
                }}
                className="h-9 px-3 text-xs"
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const weekAgo = new Date(today);
                  weekAgo.setDate(today.getDate() - 7);
                  weekAgo.setHours(0, 0, 0, 0);
                  const endOfToday = new Date();
                  endOfToday.setHours(23, 59, 59, 999);
                  setFromDate(weekAgo);
                  setToDate(endOfToday);
                }}
                className="h-9 px-3 text-xs"
              >
                Last 7 days
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const monthAgo = new Date(today);
                  monthAgo.setDate(today.getDate() - 30);
                  monthAgo.setHours(0, 0, 0, 0);
                  const endOfToday = new Date();
                  endOfToday.setHours(23, 59, 59, 999);
                  setFromDate(monthAgo);
                  setToDate(endOfToday);
                }}
                className="h-9 px-3 text-xs"
              >
                Last 30 days
              </Button>
            </div>
          </div>

          <div className="flex gap-2 mb-3 border-b border-gray-200">
            {/* Task tab hidden for now - not ready for deployment */}
            {/* <button
              onClick={() => {
                setViewMode('task-hierarchy');
                setHierarchyLevel('major-tasks');
                setSelectedMajorTask(null);
                setSelectedSubtask(null);
              }}
              className={`px-4 py-2 font-medium transition-colors ${viewMode === 'task-hierarchy'
                ? 'text-[#111d29] border-b-2 border-[#111d29] bg-[#111d29]/5'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Task
            </button> */}
            <button
              onClick={() => setViewMode('processed-logs')}
              className={`px-4 py-2 font-medium transition-colors ${viewMode === 'processed-logs'
                ? 'text-[#111d29] border-b-2 border-[#111d29] bg-[#111d29]/5'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Logs ({tasks.length})
            </button>
          </div>

          {/* Back button for hierarchy navigation */}
          {viewMode === 'task-hierarchy' && hierarchyLevel !== 'major-tasks' && (
            <button
              onClick={() => {
                if (hierarchyLevel === 'processed-logs') {
                  setHierarchyLevel('subtasks');
                  setSelectedSubtask(null);
                } else if (hierarchyLevel === 'subtasks') {
                  setHierarchyLevel('major-tasks');
                  setSelectedMajorTask(null);
                }
              }}
              className="mb-3 flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              <span>←</span>
              <span>Back</span>
            </button>
          )}

          <div className={`px-4 py-3 rounded-lg mb-3 ${viewMode === 'task-hierarchy' && hierarchyLevel === 'major-tasks'
            ? 'bg-white'
            : viewMode === 'task-hierarchy' && hierarchyLevel === 'subtasks'
              ? 'bg-white'
              : viewMode === 'task-hierarchy' && hierarchyLevel === 'processed-logs'
                ? 'bg-white'
                : viewMode === 'processed-logs'
                  ? 'bg-white'
                  : 'bg-white'
            }`}>
            <div className={`text-lg font-medium mb-1 ${viewMode === 'task-hierarchy' && hierarchyLevel === 'major-tasks'
              ? 'text-black'
              : 'text-gray-800'
              }`}>
              {viewMode === 'task-hierarchy' && hierarchyLevel === 'major-tasks' && 'Major Tasks Overview'}
              {viewMode === 'task-hierarchy' && hierarchyLevel === 'subtasks' && selectedMajorTask && (
                <>
                  Subtasks for: <span className="text-[#111d29]/80 font-semibold">{selectedMajorTask.major_task_title}</span>
                </>
              )}
              {viewMode === 'task-hierarchy' && hierarchyLevel === 'processed-logs' && selectedSubtask && (
                <>
                  Logs for: <span className="text-[#111d29]/80 font-semibold">{selectedSubtask.subtask_name}</span>
                </>
              )}
              {viewMode === 'processed-logs' && 'Activity Logs'}
              {userId && <span className={`text-sm font-normal ${viewMode === 'task-hierarchy' && hierarchyLevel === 'major-tasks'
                ? 'text-black/70'
                : 'text-black/70'
                }`}> - {userId.substring(0, 8)}...</span>}
            </div>
            <div className={`text-xs ${viewMode === 'task-hierarchy' && hierarchyLevel === 'major-tasks'
              ? 'text-black/70'
              : 'text-black/70'
              }`}>
              Updates every 30 seconds • Click to {viewMode === 'task-hierarchy' ? 'navigate' : 'expand and see details'}
            </div>
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
          <div className="">
            {viewMode === 'task-hierarchy' && (
              <div className="space-y-3">
                {hierarchyLevel === 'major-tasks' && (
                  majorTasks.length === 0 ? (
                    <div className="text-gray-500 text-center py-8">
                      <div className="mb-2">No major tasks yet</div>
                      <div className="text-xs">Major tasks will appear here as the system processes your activities</div>
                    </div>
                  ) : (
                    majorTasks.map(majorTask => formatMajorTaskEntry(majorTask, true))
                  )
                )}

                {hierarchyLevel === 'subtasks' && selectedMajorTask && (
                  (() => {
                    const relatedSubtasks = selectedMajorTask.subtask_ids.map(id => getSubtaskById(id)).filter(Boolean);
                    return relatedSubtasks.length === 0 ? (
                      <div className="text-gray-500 text-center py-8">
                        <div className="mb-2">No subtasks found</div>
                        <div className="text-xs">This major task has no associated subtasks</div>
                      </div>
                    ) : (
                      relatedSubtasks.map(subtask => formatSubtaskEntry(subtask, false, true))
                    );
                  })()
                )}

                {hierarchyLevel === 'processed-logs' && selectedSubtask && (
                  (() => {
                     const processedLogs = selectedSubtask.personalized_task_ids.map(id => getProcessedLogById(id)).filter(Boolean);
                    return processedLogs.length === 0 ? (
                      <div className="text-gray-500 text-center py-8">
                        <div className="mb-2">No processed logs found</div>
                        <div className="text-xs">This subtask has no associated processed logs</div>
                      </div>
                    ) : (
                      processedLogs.map(log => formatProcessedLogEntry(log, false))
                    );
                  })()
                )}
              </div>
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

      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none"></div>

      {/* Major Task Info Modal */}
      {showMajorTaskModal && selectedMajorTaskForModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowMajorTaskModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target className="h-6 w-6 text-[#111d29]" />
                <h2 className="text-xl font-semibold text-[#111d29]">Major Task Details</h2>
              </div>
              <button
                onClick={() => setShowMajorTaskModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Task Title</h3>
                <p className="text-lg font-semibold text-[#111d29]">
                  {selectedMajorTaskForModal.major_task_title}
                </p>
              </div>

              {/* Summary */}
              {selectedMajorTaskForModal.major_task_summary &&
                selectedMajorTaskForModal.major_task_summary.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Summary</h3>
                    <div className="space-y-2">
                      {selectedMajorTaskForModal.major_task_summary.map((summary, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <span className="text-[#111d29] font-bold mt-0.5">•</span>
                          <span className="flex-1 text-gray-700">{summary}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Subtasks List */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">
                  Related Subtasks ({selectedMajorTaskForModal.subtask_ids.length})
                </h3>
                {selectedMajorTaskForModal.subtask_ids.length > 0 ? (
                  <div className="space-y-2">
                    {selectedMajorTaskForModal.subtask_ids.map(id => {
                      const subtask = getSubtaskById(id);
                      return subtask ? (
                        <div
                          key={id}
                          className="p-4 bg-[#3d5266] border border-[#4a6073] rounded-lg hover:bg-[#2a3f52] transition-colors"
                        >
                          <div className="flex items-start gap-2 mb-2">
                            <ListTodo className="h-5 w-5 text-white/80 flex-shrink-0 mt-0.5" />
                            <div className="font-medium text-white">
                              {subtask.subtask_name}
                            </div>
                          </div>
                          <div className="text-sm text-white/70 mb-2">
                            {subtask.subtask_summary}
                          </div>
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#2a3f52] rounded-full">
                            <span className="text-xs font-medium text-white/90">
                              {subtask.personalized_task_ids.length} processed log{subtask.personalized_task_ids.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No subtasks available</p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setShowMajorTaskModal(false)}
                className="w-full px-4 py-2 bg-[#111d29] hover:bg-[#1a2936] text-white rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subtask Info Modal */}
      {showSubtaskModal && selectedSubtaskForModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowSubtaskModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ListTodo className="h-6 w-6 text-[#3d5266]" />
                <h2 className="text-xl font-semibold text-[#3d5266]">Subtask Details</h2>
              </div>
              <button
                onClick={() => setShowSubtaskModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Subtask Name</h3>
                <p className="text-lg font-semibold text-[#3d5266]">
                  {selectedSubtaskForModal.subtask_name}
                </p>
              </div>

              {/* Summary */}
              {selectedSubtaskForModal.subtask_summary && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Summary</h3>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-700 leading-relaxed">
                      {selectedSubtaskForModal.subtask_summary}
                    </p>
                  </div>
                </div>
              )}

              {/* Processed Logs List */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">
                  Related Processed Logs ({selectedSubtaskForModal.personalized_task_ids.length})
                </h3>
                {selectedSubtaskForModal.personalized_task_ids.length > 0 ? (
                  <div className="space-y-1">
                    {selectedSubtaskForModal.personalized_task_ids.map(id => {
                      const processedLog = getProcessedLogById(id);
                      return processedLog ? formatProcessedLogEntry(processedLog, false) : null;
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No processed logs available</p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setShowSubtaskModal(false)}
                className="w-full px-4 py-2 bg-[#3d5266] hover:bg-[#2a3f52] text-white rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}