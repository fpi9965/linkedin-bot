import cvParser from './cvParser.js';
import linkedinOptimizer from './linkedinOptimizer.js';
import jobSearcher from './jobSearcher.js';
import autoApplyService from './autoApply.js';
import recruiterHandler from './recruiterHandler.js';
import linkedinNotifier from './linkedinNotifier.js';

class LinkedInWorkflow {
  async runFullWorkflow(cvText, preferences = {}) {
    console.log('🚀 Starting LinkedIn Auto-Optimization Workflow...\n');

    const steps = {};

    // Step 1: CV Parsing
    console.log('📄 Step 1: Parsing CV...');
    steps.cvData = cvParser.parse(cvText);
    console.log(`   ✓ Extracted ${steps.cvData.skills.length} skills, ${steps.cvData.experience.length} experiences, ${steps.cvData.job_titles.length} job titles\n`);

    // Step 2: Profile Optimization
    console.log('✏️  Step 2: Generating optimized LinkedIn profile...');
    steps.profile = linkedinOptimizer.generateFullProfile(steps.cvData, preferences.industry);
    console.log(`   ✓ Headline generated (${steps.profile.headline.length} chars)`);
    console.log(`   ✓ About section generated (${steps.profile.about.split('\n').length} lines)`);
    console.log(`   ✓ ${steps.profile.experience.length} experience entries formatted`);
    console.log(`   ✓ ${Object.keys(steps.profile.skills).length} skill categories created\n`);

    // Step 3: Job Matching
    console.log('🔍 Step 3: Searching and matching jobs...');
    steps.jobs = await jobSearcher.searchJobs(steps.cvData, preferences);
    console.log(`   ✓ Found ${steps.jobs.length} matching jobs\n`);

    // Step 4: Auto Application
    console.log('📝 Step 4: Generating applications...');
    const topJobs = steps.jobs
      .filter(j => j.match_score >= (preferences.min_match_score || 40))
      .slice(0, preferences.max_applications || 5);
    steps.applications = await autoApplyService.applyToJobs(topJobs, steps.cvData, preferences);
    const submitted = steps.applications.filter(a => a.submitted).length;
    const ready = steps.applications.filter(a => !a.submitted).length;
    console.log(`   ✓ ${submitted} applications submitted, ${ready} ready to submit\n`);

    // Step 5: Notification
    console.log('🔔 Step 5: Sending notification...');
    steps.notification = await linkedinNotifier.sendDailySummary({
      new_matches: steps.jobs.length,
      applications_sent: submitted,
      recruiter_messages: 0,
      top_jobs: steps.jobs.slice(0, 5),
    });
    console.log(`   ✓ Notification ${steps.notification?.success ? 'sent' : 'ready'}\n`);

    console.log('✅ LinkedIn Workflow complete!');
    return steps;
  }

  async runCvParsingOnly(cvText) {
    const cvData = cvParser.parse(cvText);
    return { cvData };
  }

  async runProfileOptimization(cvText) {
    const cvData = cvParser.parse(cvText);
    const profile = linkedinOptimizer.generateFullProfile(cvData);
    return { cvData, profile };
  }

  async runJobMatching(cvText, preferences = {}) {
    const cvData = cvParser.parse(cvText);
    const jobs = await jobSearcher.searchJobs(cvData, preferences);
    return { cvData, jobs };
  }

  async runAutoApply(cvText, preferences = {}) {
    const cvData = cvParser.parse(cvText);
    const jobs = preferences.jobs || await jobSearcher.searchJobs(cvData, preferences);
    const topJobs = jobs
      .filter(j => j.match_score >= (preferences.min_match_score || 40))
      .slice(0, preferences.max_applications || 5);
    const applications = await autoApplyService.applyToJobs(topJobs, cvData, preferences);
    return { cvData, jobs, applications };
  }

  async handleRecruiterMessage(messageData, context = {}) {
    context.skills = context.skills || [];
    context.tools = context.tools || [];
    const result = await recruiterHandler.handleIncomingMessage(messageData, context);
    return result;
  }

  async generateDailyReport(cvText, preferences = {}) {
    const cvData = cvParser.parse(cvText);
    const jobs = preferences.jobs || await jobSearcher.searchJobs(cvData, preferences);
    const conversations = recruiterHandler.getAllConversations();
    const submissions = autoApplyService.getSubmissionHistory();

    return {
      date: new Date().toISOString().split('T')[0],
      summary: {
        new_matches: jobs.length,
        applications_sent: submissions.filter(s => s.submitted).length,
        applications_ready: submissions.filter(s => !s.submitted).length,
        recruiter_messages: conversations.length,
        active_conversations: conversations.filter(c => c.message_count > 1).length,
      },
      top_jobs: jobs.slice(0, 5).map(j => ({
        title: j.title,
        company: j.company,
        match_score: j.match_score,
        location: j.location,
      })),
      recruiter_conversations: conversations,
      recent_submissions: submissions.slice(-5),
    };
  }
}

export default new LinkedInWorkflow();
