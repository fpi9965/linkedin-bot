import 'dotenv/config';
import axios from 'axios';

class LinkedInNotifier {
  constructor() {
    this.telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    this.telegramChatId = process.env.TELEGRAM_CHAT_ID;
    this.whatsappNumber = process.env.LINKEDIN_NOTIFY_PHONE;
    this.whatsappApiUrl = process.env.WHATSAPP_API_URL || '';
    this.whatsappApiKey = process.env.WHATSAPP_API_KEY || '';
  }

  async sendDailySummary(data) {
    const message = this.formatSummaryMessage(data);
    const results = [];

    if (this.telegramToken && this.telegramChatId) {
      results.push(await this.sendTelegram(message));
    }
    if (this.whatsappNumber && (this.whatsappApiUrl || this.whatsappApiKey)) {
      results.push(await this.sendWhatsApp(message));
    }

    console.log('📬 LinkedIn notification sent via', results.filter(r => r.success).length, 'channel(s)');
    return { success: results.some(r => r.success), channels: results };
  }

  async sendJobAlert(job) {
    const message = [
      `📌 New Job Match`,
      `━━━━━━━━━━━━━━━`,
      `📍 ${job.title}`,
      `🏢 ${job.company}`,
      `📮 ${job.location}`,
      `⭐ Match Score: ${job.match_score}%`,
      job.apply_url ? `🔗 ${job.apply_url}` : '',
      job.salary ? `💰 ${job.salary}` : '',
    ].filter(Boolean).join('\n');

    const results = [];
    if (this.telegramToken && this.telegramChatId) {
      results.push(await this.sendTelegram(message));
    }
    return { success: results.some(r => r.success), channels: results };
  }

  async sendApplicationConfirmation(job, status) {
    const message = [
      status === 'submitted' ? '✅ Application Submitted' : '📝 Application Ready',
      `━━━━━━━━━━━━━━━`,
      `📍 ${job.title}`,
      `🏢 ${job.company}`,
      status === 'submitted' ? '✔ Successfully submitted' : '✏ Ready for manual submission',
      job.apply_url ? `🔗 ${job.apply_url}` : '',
    ].filter(Boolean).join('\n');

    if (this.telegramToken && this.telegramChatId) {
      return this.sendTelegram(message);
    }
    return { success: false, reason: 'No notification channel configured' };
  }

  async sendRecruiterReplyAlert(replyData) {
    const message = [
      `💬 Recruiter Reply Sent`,
      `━━━━━━━━━━━━━━━`,
      `👤 From: ${replyData.from || replyData.recruiter_name || 'Unknown'}`,
      `📋 Intent: ${replyData.intent || 'general'}`,
      `⏱ ${new Date(replyData.replied_at).toLocaleString()}`,
      ``,
      `✉ Reply preview:`,
      replyData.reply ? replyData.reply.slice(0, 200) + '...' : '',
    ].filter(Boolean).join('\n');

    if (this.telegramToken && this.telegramChatId) {
      return this.sendTelegram(message);
    }
    return { success: false, reason: 'No notification channel configured' };
  }

  formatSummaryMessage(data) {
    const lines = [
      `🔔 Job Update`,
      `━━━━━━━━━━━━━━━`,
      `• New Matches: ${data.new_matches || 0}`,
      `• Applications Sent: ${data.applications_sent || 0}`,
      `• Recruiter Messages: ${data.recruiter_messages || 0}`,
      ``,
    ];

    if (data.top_jobs && data.top_jobs.length > 0) {
      lines.push(`🏆 Top Matches:`);
      for (const job of data.top_jobs.slice(0, 3)) {
        lines.push(`  ${job.match_score}% | ${job.title} @ ${job.company}`);
      }
    }

    lines.push(`\n📅 ${new Date().toLocaleDateString()}`);
    return lines.join('\n');
  }

  async sendTelegram(message) {
    try {
      const response = await axios.post(
        `https://api.telegram.org/bot${this.telegramToken}/sendMessage`,
        {
          chat_id: this.telegramChatId,
          text: message,
          parse_mode: 'Markdown',
        }
      );
      console.log('✅ Telegram notification sent');
      return { success: true, channel: 'telegram', message_id: response.data?.result?.message_id };
    } catch (error) {
      console.error('❌ Telegram error:', error.message);
      return { success: false, channel: 'telegram', error: error.message };
    }
  }

  async sendWhatsApp(message) {
    try {
      if (this.whatsappApiUrl) {
        const response = await axios.post(
          this.whatsappApiUrl,
          {
            to: this.whatsappNumber,
            text: message,
          },
          {
            headers: this.whatsappApiKey
              ? { Authorization: `Bearer ${this.whatsappApiKey}` }
              : {},
          }
        );
        console.log('✅ WhatsApp notification sent');
        return { success: true, channel: 'whatsapp', message_id: response.data?.message_id };
      }
      return { success: false, channel: 'whatsapp', reason: 'API URL not configured' };
    } catch (error) {
      console.error('❌ WhatsApp notification error:', error.message);
      return { success: false, channel: 'whatsapp', error: error.message };
    }
  }
}

export default new LinkedInNotifier();
