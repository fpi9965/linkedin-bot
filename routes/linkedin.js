import express from 'express';
import linkedinWorkflow from '../services/linkedinWorkflow.js';
import cvParser from '../services/cvParser.js';
import linkedinOptimizer from '../services/linkedinOptimizer.js';
import jobSearcher from '../services/jobSearcher.js';
import autoApplyService from '../services/autoApply.js';
import recruiterHandler from '../services/recruiterHandler.js';
import linkedinNotifier from '../services/linkedinNotifier.js';

const router = express.Router();

router.post('/parse-cv', async (req, res) => {
  try {
    const { cv_text } = req.body;
    if (!cv_text) return res.status(400).json({ error: 'cv_text is required' });
    const result = await linkedinWorkflow.runCvParsingOnly(cv_text);
    res.json({ success: true, data: result.cvData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/optimize-profile', async (req, res) => {
  try {
    const { cv_text, industry } = req.body;
    if (!cv_text) return res.status(400).json({ error: 'cv_text is required' });
    const result = await linkedinWorkflow.runProfileOptimization(cv_text);
    res.json({ success: true, data: result.profile });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/search-jobs', async (req, res) => {
  try {
    const { cv_text, preferences } = req.body;
    if (!cv_text) return res.status(400).json({ error: 'cv_text is required' });
    const result = await linkedinWorkflow.runJobMatching(cv_text, preferences || {});
    res.json({ success: true, data: { jobs: result.jobs } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/apply', async (req, res) => {
  try {
    const { cv_text, jobs, preferences } = req.body;
    if (!cv_text) return res.status(400).json({ error: 'cv_text is required' });
    const result = await linkedinWorkflow.runAutoApply(cv_text, { jobs, ...preferences });
    res.json({ success: true, data: { applications: result.applications } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/recruiter-reply', async (req, res) => {
  try {
    const { message, context } = req.body;
    if (!message || !message.text) return res.status(400).json({ error: 'message.text is required' });
    const result = await linkedinWorkflow.handleRecruiterMessage(message, context || {});
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/run-workflow', async (req, res) => {
  try {
    const { cv_text, preferences } = req.body;
    if (!cv_text) return res.status(400).json({ error: 'cv_text is required' });
    const result = await linkedinWorkflow.runFullWorkflow(cv_text, preferences || {});
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/daily-report', async (req, res) => {
  try {
    const { cv_text, preferences } = req.body;
    const report = await linkedinWorkflow.generateDailyReport(cv_text || '', preferences || {});
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/conversations', (req, res) => {
  const convos = recruiterHandler.getAllConversations();
  res.json({ success: true, data: convos });
});

router.get('/submissions', (req, res) => {
  const subs = autoApplyService.getSubmissionHistory();
  res.json({ success: true, data: subs });
});

router.post('/test-notification', async (req, res) => {
  try {
    const result = await linkedinNotifier.sendDailySummary({
      new_matches: 5,
      applications_sent: 2,
      recruiter_messages: 1,
      top_jobs: [
        { title: 'Senior Engineer', company: 'Tech Corp', match_score: 92, location: 'Remote' },
        { title: 'Full Stack Developer', company: 'Startup Inc', match_score: 85, location: 'NYC' },
      ],
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
