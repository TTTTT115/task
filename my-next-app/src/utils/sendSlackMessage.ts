import axios from 'axios';

interface TaskPayload {
  id: string;
  title: string;
  assigneeId?: string;
  status: string;
  deadline?: string;
}

export async function sendSlackMessage(task: TaskPayload): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error('SLACK_WEBHOOK_URL is not set. Skipping Slack notification.');
    return;
  }

  const message = {
    text: `Task Updated:
      ID: ${task.id}
      Title: ${task.title}
      Assignee ID: ${task.assigneeId || 'Unassigned'}
      Status: ${task.status}
      Deadline: ${task.deadline || 'Not set'}`,
  };

  try {
    await axios.post(webhookUrl, message);
    console.log('Slack notification sent successfully.');
  } catch (error) {
    console.error('Error sending Slack notification:', error);
    // It's important to decide how to handle errors.
    // For now, we'll just log it, but in a production app, you might want to retry or alert.
  }
}
