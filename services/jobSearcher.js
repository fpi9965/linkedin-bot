import 'dotenv/config';
import axios from 'axios';

class JobSearcher {
  constructor() {
    this.jobBoards = {
      linkedin: 'https://www.linkedin.com/jobs/search',
      indeed: 'https://api.indeed.com/ads/apisearch',
      greenhouse: '',
      lever: '',
    };
    this.apiKeys = {
      indeed: process.env.INDEED_API_KEY || '',
      adzuna: process.env.ADZUNA_API_KEY || '',
      adzunaAppId: process.env.ADZUNA_APP_ID || '',
    };
  }

  async searchJobs(cvData, preferences = {}) {
    const queries = this.buildSearchQueries(cvData, preferences);
    const results = [];

    if (this.apiKeys.adzuna && this.apiKeys.adzunaAppId) {
      try {
        const adzunaResults = await this.searchAdzuna(queries, preferences);
        results.push(...adzunaResults);
      } catch (e) {
        console.warn('⚠️ Adzuna search failed:', e.message);
      }
    }

    if (preferences.mockResults || !this.apiKeys.adzuna) {
      const mockResults = this.generateMockMatches(cvData, preferences, queries);
      results.push(...mockResults);
    }

    const scored = this.scoreJobs(results, cvData, preferences);
    return scored.sort((a, b) => b.match_score - a.match_score);
  }

  buildSearchQueries(cvData, preferences) {
    const titles = preferences.job_titles?.length > 0
      ? preferences.job_titles
      : cvData.job_titles.slice(0, 3);

    const keywords = [
      ...titles,
      ...cvData.skills.slice(0, 5),
      ...cvData.tools.slice(0, 3),
    ];

    return {
      what: titles.join(' '),
      keywords: [...new Set(keywords)].join(' '),
      location: preferences.location || '',
      remote: preferences.remote || '',
      salary_min: preferences.salary_min || '',
    };
  }

  async searchAdzuna(queries, preferences) {
    const params = {
      app_id: this.apiKeys.adzunaAppId,
      app_key: this.apiKeys.adzuna,
      what: queries.what,
      where: preferences.location || '',
      distance: 50,
      max_days_old: 30,
      results_per_page: 20,
      content_type: 'application/json',
    };

    if (preferences.country) params.country = preferences.country;
    if (preferences.salary_min) params.salary_min = preferences.salary_min;

    const response = await axios.get('https://api.adzuna.com/v1/api/jobs/gb/search/1', { params });
    const jobs = response.data?.results || [];

    return jobs.map(job => ({
      title: job.title,
      company: job.company?.display_name || 'Unknown',
      location: job.location?.display_name || '',
      match_score: 0,
      apply_url: job.redirect_url || '',
      description: job.description || '',
      salary: job.salary_min ? `${job.salary_min} - ${job.salary_max || 'N/A'} ${job.salary_currency || ''}` : '',
      posted: job.created ? new Date(job.created).toISOString().split('T')[0] : '',
      source: 'Adzuna',
      id: job.id,
    }));
  }

  generateMockMatches(cvData, preferences, queries) {
    const titles = preferences.job_titles?.length > 0
      ? preferences.job_titles
      : cvData.job_titles.slice(0, 3);

    const industries = ['Tech', 'FinTech', 'HealthTech', 'E-Commerce', 'SaaS', 'Enterprise'];
    const locations = preferences.location
      ? [preferences.location, 'Remote', 'Hybrid']
      : ['Remote', 'San Francisco, CA', 'New York, NY', 'London, UK', 'Dubai, UAE', 'Riyadh, KSA'];

    return titles.flatMap((title, i) =>
      industries.slice(0, 3).map((industry, j) => ({
        title: `${industry === 'FinTech' ? 'Senior ' : ''}${title}`,
        company: `${industry} ${['Solutions', 'Inc', 'Labs', 'Global', 'Corp'][j]}`,
        location: locations[i % locations.length],
        match_score: 0,
        apply_url: preferences.apply_url || `https://example.com/apply/${i}${j}`,
        description: `We are looking for a ${title} to join our ${industry} team. Ideal candidate has experience with ${cvData.tools.slice(0, 3).join(', ')}.`,
        salary: ['$120k - $160k', '$100k - $140k', '$130k - $180k'][j],
        posted: new Date(Date.now() - j * 86400000).toISOString().split('T')[0],
        source: 'LinkedIn',
        id: `mock-${i}-${j}`,
      }))
    );
  }

  scoreJobs(jobs, cvData, preferences) {
    const skillSet = new Set([...cvData.skills, ...cvData.tools].map(s => s.toLowerCase()));
    const titleSet = new Set(cvData.job_titles.map(t => t.toLowerCase()));
    const preferredTitles = new Set((preferences.job_titles || []).map(t => t.toLowerCase()));

    return jobs.map(job => {
      let score = 0;
      const titleLower = job.title.toLowerCase();
      const descLower = (job.description || '').toLowerCase();

      for (const title of titleSet) {
        if (titleLower.includes(title)) score += 25;
      }
      for (const title of preferredTitles) {
        if (titleLower.includes(title)) score += 15;
      }
      for (const skill of skillSet) {
        if (titleLower.includes(skill)) score += 10;
        if (descLower.includes(skill)) score += 5;
      }
      if (job.location && preferences.location && job.location.toLowerCase().includes(preferences.location.toLowerCase())) score += 10;
      if (preferences.remote === 'remote' && job.location && /remote/i.test(job.location)) score += 10;
      if (preferences.remote === 'hybrid' && job.location && /hybrid/i.test(job.location)) score += 5;

      const maxScore = 100;
      job.match_score = Math.min(Math.round(score), maxScore);
      return job;
    });
  }

  parseJobBoardsFromUrl(url) {
    if (url.includes('linkedin.com')) return 'LinkedIn';
    if (url.includes('indeed.com')) return 'Indeed';
    if (url.includes('glassdoor.com')) return 'Glassdoor';
    if (url.includes('monster.com')) return 'Monster';
    if (url.includes('ziprecruiter.com')) return 'ZipRecruiter';
    return 'Other';
  }
}

export default new JobSearcher();
