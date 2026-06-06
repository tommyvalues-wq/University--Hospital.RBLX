import axios from 'axios';

export async function sendWebhook(webhookUrl, payload) {
  if (!webhookUrl) {
    return { ok: false, error: 'Missing webhook URL' };
  }

  try {
    const response = await axios.post(webhookUrl, payload, {
      headers: { 'Content-Type': 'application/json' }
    });

    return { ok: true, status: response.status };
  } catch (error) {
    console.error('Discord webhook error:', error.message);
    return { ok: false, error: error.message };
  }
}
