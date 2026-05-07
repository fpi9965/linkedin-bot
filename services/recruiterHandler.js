class RecruiterHandler {
  constructor() {
    this.repliedMessages = new Set();
    this.conversations = new Map();
  }

  detectIntent(message) {
    const text = message.toLowerCase();

    if (/interested|opportunity|position|role|job opening|hiring|vacancy|career|potential role/i.test(text)) {
      return 'job_offer';
    }
    if (/interview|meet|schedule|chat|call|discuss|coffee|talk|conversation/i.test(text)) {
      return 'interview_request';
    }
    if (/resume|cv|profile|background|experience|qualifications?/i.test(text)) {
      return 'info_request';
    }
    if (/rate|salary|compensation|pay|package|budget/i.test(text)) {
      return 'salary_discussion';
    }
    if (/refer|recommend|connection|network|introduce/i.test(text)) {
      return 'networking';
    }
    if (/not interested|no thanks|decline|unavailable/i.test(text)) {
      return 'decline';
    }
    return 'general';
  }

  generateReply(message, context = {}) {
    const intent = this.detectIntent(message);

    switch (intent) {
      case 'job_offer':
        return this.replyJobOffer(message, context);
      case 'interview_request':
        return this.replyInterviewRequest(context);
      case 'info_request':
        return this.replyInfoRequest(context);
      case 'salary_discussion':
        return this.replySalaryDiscussion(context);
      case 'networking':
        return this.replyNetworking(context);
      case 'decline':
        return this.replyDecline();
      default:
        return this.replyGeneral(context);
    }
  }

  replyJobOffer(message, context) {
    const name = context.recruiter_name || 'there';
    const company = context.company || 'your company';

    return [
      `Hi ${name}, thank you for reaching out!`,
      '',
      `I appreciate you considering me for an opportunity at ${company}. I'm always open to exploring roles where I can make a meaningful impact.`,
      '',
      `Could you please share more details about:`,
      `• The role title and key responsibilities`,
      `• The team structure and reporting line`,
      `• The tech stack or tools involved`,
      `• Location/remote policy`,
      '',
      `Looking forward to learning more!`,
      '',
      `Best regards,`,
      context.applicant_name || process.env.USER_NAME || 'Applicant',
    ].join('\n');
  }

  replyInterviewRequest(context) {
    const name = context.recruiter_name || 'there';

    return [
      `Hi ${name}, thanks for the invitation. I would be happy to discuss the opportunity further.`,
      '',
      `Could you kindly share a few time slots that work for you? I'm generally available:`,
      `• Weekdays after 4 PM (GST)`,
      `• Mornings between 9 AM - 12 PM (GST)`,
      '',
      `Please feel free to send a calendar invite with any relevant details or materials I should review beforehand.`,
      '',
      `Looking forward to our conversation!`,
      '',
      `Best regards,`,
      context.applicant_name || process.env.USER_NAME || 'Applicant',
    ].join('\n');
  }

  replyInfoRequest(context) {
    const name = context.recruiter_name || 'there';

    return [
      `Hi ${name}, thank you for your interest in my profile.`,
      '',
      `I have attached my CV and portfolio for your reference. Here is a quick summary of my background:`,
      `• Role: ${context.job_title || 'Professional in tech'} `,
      `• Key Skills: ${(context.skills || []).slice(0, 5).join(', ')}`,
      `• Tools: ${(context.tools || []).slice(0, 4).join(', ')}`,
      '',
      `Please let me know if you need any additional information. I'd be happy to discuss how my experience aligns with your needs.`,
      '',
      `Best regards,`,
      context.applicant_name || process.env.USER_NAME || 'Applicant',
    ].join('\n');
  }

  replySalaryDiscussion(context) {
    const name = context.recruiter_name || 'there';

    return [
      `Hi ${name}, thank you for discussing compensation. My expected range is flexible based on the role, benefits, and overall package.`,
      '',
      `For reference, I am targeting:`,
      `• ${context.salary_range || 'Competitive market rate'}`,
      `• Open to discussing total compensation including benefits, equity, and growth opportunities`,
      '',
      `I'd be happy to discuss further once we align on the role details.`,
      '',
      `Best regards,`,
      context.applicant_name || process.env.USER_NAME || 'Applicant',
    ].join('\n');
  }

  replyNetworking(context) {
    const name = context.recruiter_name || 'there';

    return [
      `Hi ${name}, thank you for reaching out! I appreciate the connection and am always happy to expand my professional network.`,
      '',
      `I'd love to stay in touch and learn more about your work at ${context.company || 'your organization'}.`,
      '',
      `Feel free to share any updates or opportunities — I'm always open to exciting conversations.`,
      '',
      `Best regards,`,
      context.applicant_name || process.env.USER_NAME || 'Applicant',
    ].join('\n');
  }

  replyGeneral(context) {
    const name = context.recruiter_name || 'there';

    return [
      `Hi ${name}, thank you for your message. I appreciate you reaching out.`,
      '',
      `Could you please share a bit more context about your message and how I might be able to help?`,
      '',
      `Looking forward to your reply!`,
      '',
      `Best regards,`,
      context.applicant_name || process.env.USER_NAME || 'Applicant',
    ].join('\n');
  }

  replyDecline() {
    return [
      `Thank you for reaching out. I appreciate the opportunity, but I'm currently focused on other opportunities and will need to decline at this time.`,
      '',
      `I wish you the best in finding the right candidate for your team.`,
      '',
      `Best regards,`,
      process.env.USER_NAME || 'Applicant',
    ].join('\n');
  }

  async handleIncomingMessage(messageData, context = {}) {
    const messageId = messageData.id || `${messageData.from}_${Date.now()}`;

    if (this.repliedMessages.has(messageId)) {
      return { skipped: true, reason: 'Already replied' };
    }

    const reply = this.generateReply(messageData.text || '', context);
    const intent = this.detectIntent(messageData.text || '');

    if (!this.conversations.has(messageData.from)) {
      this.conversations.set(messageData.from, { messages: [], replies: [] });
    }
    const conv = this.conversations.get(messageData.from);
    conv.messages.push({ text: messageData.text, received_at: new Date().toISOString() });
    conv.replies.push({ text: reply, intent });

    this.repliedMessages.add(messageId);

    return {
      intent,
      reply,
      from: messageData.from,
      recruiter_name: context.recruiter_name || 'Unknown',
      replied_at: new Date().toISOString(),
    };
  }

  getConversationHistory(contactId) {
    return this.conversations.get(contactId) || null;
  }

  getAllConversations() {
    return [...this.conversations.entries()].map(([id, data]) => ({
      contact: id,
      message_count: data.messages.length,
      last_message: data.messages[data.messages.length - 1],
      last_reply: data.replies[data.replies.length - 1],
    }));
  }
}

export default new RecruiterHandler();
