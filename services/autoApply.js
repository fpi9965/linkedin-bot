import 'dotenv/config';

class AutoApplyService {
  constructor() {
    this.submissions = [];
  }

  generateCoverLetter(cvData, job) {
    const { title, company, description } = job;
    const name = process.env.USER_NAME || 'Applicant';
    const topSkills = cvData.skills.slice(0, 5).join(', ');
    const topStrengths = cvData.strengths.slice(0, 3).map(s => s.replace(/^[•\-\s]+/, '')).join(', ');
    const tools = cvData.tools.slice(0, 4).join(', ');
    const years = this.estimateYears(cvData.experience);

    const body = [
      `Dear Hiring Manager,`,
      '',
      `I am writing to express my strong interest in the ${title} position at ${company}. With ${years > 0 ? years + '+ years of experience in ' : 'a strong background in '}${tools}, I am confident in my ability to contribute effectively to your team.`,
      '',
      `My expertise includes:`,
      `• ${topSkills}`,
      topStrengths ? `• Proven strengths in ${topStrengths.toLowerCase()}` : '',
      `• Deep proficiency with ${tools}`,
      '',
    ];

    if (description && description.length > 10) {
      const keyReqs = this.extractKeywords(description, cvData);
      if (keyReqs.length > 0) {
        body.push(`I noted that your ideal candidate has experience with ${keyReqs.slice(0, 3).join(', ')}, which aligns directly with my background and accomplishments.`);
        body.push('');
      }
    }

    body.push(`I am eager to bring my skills and passion to ${company} and would welcome the opportunity to discuss how my experience aligns with your needs.`);
    body.push('');
    body.push(`Best regards,`);
    body.push(name);

    return body.filter(Boolean).join('\n');
  }

  generateTailoredCvSummary(cvData, job) {
    const { title, company } = job;
    const relevantSkills = this.rankRelevantSkills(cvData, job.description || title);
    const topTools = cvData.tools.slice(0, 4).join(', ');
    const strengths = cvData.strengths.slice(0, 2).map(s => s.replace(/^[•\-\s]+/, '')).join(', ');

    return [
      `${cvData.job_titles[0] || 'Professional'} specializing in ${topTools}.`,
      strengths ? `Demonstrated ${strengths.toLowerCase()}.` : '',
      `Core competencies: ${relevantSkills.slice(0, 8).join(', ')}.`,
      `Seeking ${title} opportunity at ${company} to drive high-impact results.`,
    ].filter(Boolean).join(' ');
  }

  async submitApplication(job, cvData, submitFn = null) {
    const package_ = {
      job: {
        title: job.title,
        company: job.company,
        location: job.location,
        apply_url: job.apply_url,
      },
      cover_letter: this.generateCoverLetter(cvData, job),
      tailored_cv_summary: this.generateTailoredCvSummary(cvData, job),
      submitted: false,
      submitted_at: null,
    };

    if (submitFn && typeof submitFn === 'function') {
      try {
        const result = await submitFn(package_);
        package_.submitted = true;
        package_.submitted_at = new Date().toISOString();
        package_.result = result;
      } catch (error) {
        package_.error = error.message;
        package_.submitted = false;
      }
    }

    this.submissions.push(package_);
    return package_;
  }

  async applyToJobs(jobs, cvData, preferences = {}) {
    const results = [];
    const maxApplications = preferences.max_applications || Math.min(jobs.length, 5);
    const targetJobs = jobs
      .filter(j => j.match_score >= (preferences.min_match_score || 40))
      .slice(0, maxApplications);

    for (const job of targetJobs) {
      const result = await this.submitApplication(job, cvData, preferences.submitFn || null);
      results.push(result);
      await this.sleep(2000 + Math.random() * 3000);
    }

    return results;
  }

  getSubmissionHistory() {
    return this.submissions;
  }

  extractKeywords(text, cvData) {
    const allTerms = [...cvData.skills, ...cvData.tools, ...cvData.job_titles];
    const lowerText = text.toLowerCase();
    return allTerms.filter(term => lowerText.includes(term.toLowerCase()));
  }

  rankRelevantSkills(cvData, jobDescription) {
    const lowerDesc = jobDescription.toLowerCase();
    const scored = [...cvData.skills, ...cvData.tools].map(s => ({
      skill: s,
      score: lowerDesc.includes(s.toLowerCase()) ? 1 : 0,
    }));
    return scored.sort((a, b) => b.score - a.score).map(s => s.skill);
  }

  estimateYears(experience) {
    let total = 0;
    for (const exp of experience || []) {
      const years = (exp.duration || '').match(/\b(19|20)\d{2}\b/g);
      if (years && years.length >= 2) total += parseInt(years[1]) - parseInt(years[0]);
      else if (years) total += 1;
    }
    return Math.max(total, Math.min((experience || []).length * 2, 15));
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new AutoApplyService();
