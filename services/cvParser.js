import 'dotenv/config';

class CVParser {
  parse(cvText) {
    const lines = cvText.split('\n').filter(l => l.trim());

    const data = {
      skills: this.extractSkills(lines),
      experience: this.extractExperience(lines),
      job_titles: this.extractJobTitles(lines),
      strengths: this.extractStrengths(lines),
      tools: this.extractTools(lines),
      education: this.extractEducation(lines),
      certifications: this.extractCertifications(lines),
    };

    return data;
  }

  extractSkills(lines) {
    const section = this.getSection(lines, /skills?|compétences?|competenze|habilidades|технически/i);
    return section.length > 0
      ? section.flatMap(l => l.split(/[,•\–\-;]/).map(s => s.trim()).filter(Boolean))
      : this.fallbackExtract(lines, /(python|javascript|typescript|java|c\+\+|rust|go|sql|react|node|aws|docker|kubernetes|git|agile|scrum|machine learning|data analysis|communication|leadership|project management)/gi);
  }

  extractExperience(lines) {
    const entries = [];
    let capture = false;
    let current = [];
    const sectionHeaders = /experience|work\s*history|employment|professional\s*background|expérience|experiencia/i;

    for (const line of lines) {
      if (sectionHeaders.test(line)) { capture = true; continue; }
      if (/education|skills|projects|certifications|formation|éducation|educación/i.test(line) && capture) break;
      if (capture && line.trim()) current.push(line.trim());
    }

    for (let i = 0; i < current.length; i++) {
      if (/\b(19|20)\d{2}\b/.test(current[i]) || /(present|current|now|actual)/i.test(current[i])) {
        const entry = { title: '', company: '', duration: current[i], highlights: [] };
        if (i > 0) entry.title = current[i - 1];
        if (i > 1 && !/\b(19|20)\d{2}\b/.test(current[i - 1])) entry.company = current[i - 1];
        const highlights = [];
        for (let j = i + 1; j < Math.min(i + 6, current.length); j++) {
          if (/\b(19|20)\d{2}\b/.test(current[j]) && j > i + 1) break;
          highlights.push(current[j]);
        }
        entry.highlights = highlights;
        entries.push(entry);
      }
    }
    return entries;
  }

  extractJobTitles(lines) {
    const titles = [];
    for (const line of lines) {
      const match = line.match(/(senior|junior|lead|principal|staff|head|chief|associate|intern)?\s*(\w+\s*){1,4}(engineer|developer|designer|manager|analyst|consultant|architect|scientist|director|coordinator|specialist|officer|assistant|representative|agent|lead)/i);
      if (match) titles.push(match[0].trim());
    }
    return [...new Set(titles)];
  }

  extractStrengths(lines) {
    const section = this.getSection(lines, /strengths?|highlights?|achievements?|accomplishments?|key\s*results|core\s*competencies|forces|fortes|fortalezas/i);
    if (section.length > 0) return section.flatMap(l => l.split(/[,•\–\-;]/).map(s => s.trim()).filter(Boolean));
    return this.fallbackExtract(lines, /(improved|increased|reduced|delivered|led|managed|created|developed|implemented|optimized|achieved|exceeded|launched)/gi);
  }

  extractTools(lines) {
    const techs = new Set();
    const patterns = [
      /(aws|azure|gcp|docker|kubernetes|jenkins|terraform|ansible|git|github|gitlab|bitbucket|jira|confluence|trello|slack)/gi,
      /(react|angular|vue|node|express|django|flask|spring|rails|laravel|asp\.net)/gi,
      /(python|javascript|typescript|java|go|rust|ruby|php|c#|c\+\+|swift|kotlin|scala)/gi,
      /(postgresql|mysql|mongodb|redis|elasticsearch|kafka|rabbitmq|nginx)/gi,
      /(tableau|power\s*bi|looker|snowflake|bigquery|airflow|spark|hadoop)/gi,
      /(figma|sketch|adobe|photoshop|illustrator|xd)/gi,
    ];

    for (const line of lines) {
      for (const pattern of patterns) {
        const matches = line.matchAll(pattern);
        for (const m of matches) techs.add(m[0].toLowerCase());
      }
    }
    return [...techs];
  }

  extractEducation(lines) {
    const section = this.getSection(lines, /education|formation|formation\s*académique|educación|istruzione|образование/i);
    if (section.length === 0) return [];

    return section.map(line => {
      const degree = line.match(/(bachelor|master|phd|doctorate|b\.?[as]\.?|m\.?[as]\.?|ph\.?d|bachelor['']?s|master['']?s|associate['']?s|diploma|high\s*school)/i)?.[0] || '';
      const institution = line.match(/(university|college|institute|school|academy|polytechnic)\s*of?\s*[\w\s]+/i)?.[0] || '';
      const year = line.match(/\b(19|20)\d{2}\b/)?.[0] || '';
      return { degree, institution, year, raw: line.trim() };
    }).filter(e => e.degree || e.institution);
  }

  extractCertifications(lines) {
    const section = this.getSection(lines, /certifications?|licenses?|certifications\s*&\s*licenses|certifications\s*and\s*licenses|certificats|certificaciones|сертификаты/i);
    if (section.length > 0) return section.map(l => l.trim()).filter(Boolean);

    return this.fallbackExtract(lines, /(certified|certification|licensed|credential|professional\s*certificate)/gi);
  }

  getSection(lines, headerPattern) {
    let capturing = false;
    const section = [];
    for (const line of lines) {
      if (headerPattern.test(line)) { capturing = true; continue; }
      if (capturing) {
        if (/^(education|experience|skills|projects|work|summary|profile|certifications| languages|interests|references)/i.test(line) && section.length > 0) break;
        if (line.trim()) section.push(line.trim());
      }
    }
    return section;
  }

  fallbackExtract(lines, pattern) {
    return lines
      .filter(l => pattern.test(l))
      .map(l => l.trim())
      .filter(Boolean);
  }
}

export default new CVParser();
