// Get backend URL from environment variable
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://loop-1lxq.onrender.com';

// Create a new time tracking session
export async function createTimeTrackingSession(userId, startTime) {
  const response = await fetch(`${BACKEND_URL}/api/time-tracking/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userId,
      start_time: startTime.toISOString()
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to create time session: ${response.status}`);
  }

  const data = await response.json();
  return data.session_id;
}

// Update existing time tracking session with end time
export async function updateTimeTrackingSession(sessionId, endTime, totalDuration) {
  const response = await fetch(`${BACKEND_URL}/api/time-tracking/session/${sessionId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      end_time: endTime.toISOString(),
      duration_seconds: totalDuration
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to update time session: ${response.status}`);
  }

  return response.json();
}

// Fetch daily and weekly time summaries
export async function fetchTimeTrackingStats(userId) {
  const response = await fetch(`${BACKEND_URL}/api/time-tracking/stats/${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch time stats: ${response.status}`);
  }

  const data = await response.json();
  return {
    today: data.today_seconds || 0,
    week: data.week_seconds || 0
  };
}

// Get time tracking history for a user
export async function fetchTimeTrackingHistory(userId, limit = 10) {
  const response = await fetch(`${BACKEND_URL}/api/time-tracking/history/${userId}?limit=${limit}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch time history: ${response.status}`);
  }

  return response.json();
}

 