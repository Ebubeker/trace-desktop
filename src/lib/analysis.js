// Get backend URL from environment variable
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://loop-1lxq.onrender.com';

export async function fetchWorkAnalysis(userId) {
  const response = await fetch(`${BACKEND_URL}/api/analysis/work/${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export function calculateTaskDuration(task) {
  return task.activity_blocks.reduce((total, block) => {
    const start = new Date(block.start_time);
    const end = new Date(block.end_time);
    return total + (end.getTime() - start.getTime()) / 1000;
  }, 0);
}

export function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function getTaskStatusColor(status) {
  switch (status) {
    case 'COMPLETED':
      return 'text-green-600 bg-green-100';
    case 'IN PROGRESS':
      return 'text-blue-600 bg-blue-100';
    case 'NOT STARTED':
      return 'text-gray-600 bg-gray-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

export async function fetchRawActivities(limit = 50) {
  const response = await fetch(`${BACKEND_URL}/api/activity/raw?limit=${limit}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch raw activities: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchProcessedTasks(userId, limit = 50, fromDate = null, toDate = null) {
  let url = `${BACKEND_URL}/api/activity/tasks/${userId}?limit=${limit}`;
  
  if (fromDate) {
    url += `&fromDate=${fromDate.toISOString()}`;
  }
  if (toDate) {
    url += `&toDate=${toDate.toISOString()}`;
  }
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch processed tasks: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchCurrentTaskStatus(userId) {
  const response = await fetch(`${BACKEND_URL}/api/activity/status/${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch current task status: ${response.statusText}`);
  }

  return response.json();
}

export function formatTaskDuration(minutes) {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

export function getProcessedTaskStatusColor(status) {
  switch (status) {
    case 'completed':
      return 'text-green-600 bg-green-100';
    case 'active':
      return 'text-blue-600 bg-blue-100';
    case 'interrupted':
      return 'text-orange-600 bg-orange-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

export async function fetchSubtasks(userId, fromDate = null, toDate = null) {
  let url = `${BACKEND_URL}/api/activity/subtasks/${userId}`;
  
  const params = [];
  if (fromDate) {
    params.push(`fromDate=${fromDate.toISOString()}`);
  }
  if (toDate) {
    params.push(`toDate=${toDate.toISOString()}`);
  }
  
  if (params.length > 0) {
    url += `?${params.join('&')}`;
  }
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch subtasks: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchMajorTasks(userId, fromDate = null, toDate = null) {
  let url = `${BACKEND_URL}/api/activity/major-tasks/${userId}`;
  
  const params = [];
  if (fromDate) {
    params.push(`fromDate=${fromDate.toISOString()}`);
  }
  if (toDate) {
    params.push(`toDate=${toDate.toISOString()}`);
  }
  
  if (params.length > 0) {
    url += `?${params.join('&')}`;
  }
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch major tasks: ${response.statusText}`);
  }

  return response.json();
}