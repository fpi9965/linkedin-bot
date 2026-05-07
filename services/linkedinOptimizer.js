class LinkedInOptimizer {
  generateHeadline(cvData, industry = '') {
    const { job_titles, skills, strengths } = cvData;
    const primaryTitle = job_titles[0] || 'Professional';
    const topSkills = skills.slice(0, 4).join(' | ');

    const headline = `${primaryTitle} | ${topSkills}`;
    return headline.slice(0, 220);
  }

  generateAbout(cvData) {
    const { job_titles, experience, skills, strengths, tools } = cvData;
    const title = job_titles[0] || 'professional';
    const years = this.getTotalYears(experience);
    const topStrengths = strengths.slice(0, 3).map(s => s.replace(/^[•\-\s]+/, '')).join(', ');
    const techStack = tools.slice(0, 6).join(', ');

    const lines = [
      `${title} with ${years > 0 ? years + '+ years of experience in ' : 'expertise in '}${techStack || 'technology'} and a track record of delivering measurable results.`,
      '',
      topStrengths ? `Core strengths include ${topStrengths.toLowerCase()}.` : '',
      '',
      `Skilled in ${techStack || 'modern tools and frameworks'}, with deep expertise across the full product lifecycle — from strategy and design through development, deployment, and optimization.`,
      '',
      `Passionate about solving complex problems, driving continuous improvement, and building high-impact solutions that align business goals with technical excellence.`,
      '',
      `📬 Open to connecting with fellow professionals, recruiters, and teams building the future.`,
    ];

    return lines.filter(Boolean).join('\n');
  }

  generateExperience(cvData) {
    if (!cvData.experience || cvData.experience.length === 0) {
      return [this.generateEmptyExperiencePlaceholder(cvData)];
    }

    return cvData.experience.map(exp => {
      const bullets = exp.highlights && exp.highlights.length > 0
        ? exp.highlights.map(h => `• ${this.enhanceHighlight(h)}`)
        : ['• Delivered measurable outcomes through strategic planning and execution.'];

      return {
        title: exp.title || cvData.job_titles[0] || 'Professional Role',
        company: exp.company || '[Company Name]',
        duration: exp.duration || '[Start Date] – [End Date]',
        description: bullets.join('\n'),
      };
    });
  }

  generateSkills(cvData) {
    const categories = {
      'Technical Skills': [],
      'Tools & Platforms': [],
      'Soft Skills': [],
    };

    const techKeywords = ['python', 'javascript', 'typescript', 'java', 'go', 'rust', 'c++', 'sql', 'react', 'node', 'aws', 'docker', 'kubernetes', 'git', 'api', 'rest', 'graphql'];
    const toolKeywords = ['jira', 'confluence', 'jenkins', 'terraform', 'ansible', 'tableau', 'power bi', 'figma', 'sketch', 'photoshop', 'postman', 'swagger'];

    for (const skill of cvData.skills) {
      const s = skill.toLowerCase();
      if (techKeywords.some(k => s.includes(k))) categories['Technical Skills'].push(skill);
      else if (toolKeywords.some(k => s.includes(k))) categories['Tools & Platforms'].push(skill);
      else categories['Soft Skills'].push(skill);
    }

    for (const tool of cvData.tools) {
      const t = tool.toLowerCase();
      if (!categories['Technical Skills'].includes(t) && !categories['Tools & Platforms'].includes(t)) {
        if (techKeywords.some(k => t.includes(k))) categories['Technical Skills'].push(tool);
        else categories['Tools & Platforms'].push(tool);
      }
    }

    for (const strength of cvData.strengths) {
      const s = strength.toLowerCase().replace(/^[•\-\s]+/, '');
      if (!s.match(/(improved|increased|reduced|delivered|led|managed|created|developed|implemented|optimized)/i) && !categories['Soft Skills'].includes(s)) {
        categories['Soft Skills'].push(s.charAt(0).toUpperCase() + s.slice(1));
      }
    }

    return Object.fromEntries(
      Object.entries(categories).filter(([, v]) => v.length > 0)
    );
  }

  generateFullProfile(cvData, industry = '') {
    return {
      headline: this.generateHeadline(cvData, industry),
      about: this.generateAbout(cvData),
      experience: this.generateExperience(cvData),
      skills: this.generateSkills(cvData),
      recommendations: this.generateRecommendations(cvData),
    };
  }

  generateRecommendations(cvData) {
    const { skills, strengths, job_titles } = cvData;
    const title = job_titles[0] || 'colleague';

    return [
      `I had the pleasure of working with ${title}. Their expertise in ${skills.slice(0, 3).join(', ')} was instrumental in delivering our key initiatives on time and above expectations. Highly recommend.`,
    ];
  }

  enhanceHighlight(text) {
    const clean = text.replace(/^[•\-\s]+/, '');
    if (/^(improved|increased|reduced|delivered|led|managed|created|developed|implemented|optimized|achieved|exceeded|launched)/i.test(clean)) return clean;
    return `Achieved ${clean.charAt(0).toLowerCase() + clean.slice(1)}`;
  }

  getTotalYears(experience) {
    let total = 0;
    for (const exp of experience) {
      const years = exp.duration.match(/\b(19|20)\d{2}\b/g);
      if (years && years.length >= 2) {
        total += parseInt(years[1]) - parseInt(years[0]);
      } else if (years && years.length === 1) {
        total += 1;
      }
    }
    return Math.max(total, Math.min(experience.length * 2, 15));
  }

  generateEmptyExperiencePlaceholder(cvData) {
    return {
      title: cvData.job_titles[0] || '[Job Title]',
      company: '[Current/Recent Company]',
      duration: '[Start Date] – Present',
      description: `• Applying expertise in ${cvData.tools.slice(0, 3).join(', ')} to drive business outcomes\n• Leading cross-functional initiatives that improve efficiency and quality\n• Building scalable solutions aligned with industry best practices`,
    };
  }
}

export default new LinkedInOptimizer();
