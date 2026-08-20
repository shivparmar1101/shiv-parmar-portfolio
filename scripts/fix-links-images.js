const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, '..', 'blog');
const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html'));

let updated = 0;

files.forEach(file => {
  const filePath = path.join(BLOG_DIR, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  const slug = file.replace('.html', '');
  const titleSlug = slug.replace(/-/g, ' ');
  
  // 1. Add title to hero image (make alt descriptive)
  content = content.replace(
    /<img src="https:\/\/images\.unsplash\.com\/[^"]+" alt="[^"]+" title="[^"]+" class="hero-img">/g,
    (match) => {
      // Extract the current title
      const titleMatch = match.match(/title="([^"]+)"/);
      const currentTitle = titleMatch ? titleMatch[1] : titleSlug;
      // Add descriptive alt
      return match.replace(
        /alt="[^"]+"/,
        `alt="${currentTitle} - WordPress development guide by Shiv Parmar"`
      );
    }
  );
  
  // 2. Add title to author image
  content = content.replace(
    /<img src="https:\/\/avatars\.githubusercontent\.com\/[^"]+" alt="Shiv Parmar" onerror="[^"]*">/g,
    '<img src="https://avatars.githubusercontent.com/u/shivparmar1101" alt="Shiv Parmar - WordPress Developer" title="Shiv Parmar - WordPress Developer from Rajkot, India" onerror="this.src=\'https://ui-avatars.com/api/?name=Shiv+Parmar&background=c9a84c&color=fff&size=80\'">'
  );
  
  // 3. Add title to breadcrumb links
  content = content.replace(
    /<a href="\/">Home<\/a>/g,
    '<a href="/" title="Shiv Parmar - WordPress Developer Portfolio">Home</a>'
  );
  content = content.replace(
    /<a href="\/blog">Blog<\/a>/g,
    '<a href="/blog" title="WordPress Development Blog - Tips, Tutorials & Guides">Blog</a>'
  );
  
  // 4. Add title to author box social links
  content = content.replace(
    /<a href="https:\/\/linkedin\.com\/in\/shiv-parmar" target="_blank" rel="noopener">LinkedIn<\/a>/g,
    '<a href="https://linkedin.com/in/shiv-parmar" target="_blank" rel="noopener" title="Connect with Shiv Parmar on LinkedIn">LinkedIn</a>'
  );
  content = content.replace(
    /<a href="https:\/\/github\.com\/shivparmar1101" target="_blank" rel="noopener">GitHub<\/a>/g,
    '<a href="https://github.com/shivparmar1101" target="_blank" rel="noopener" title="View Shiv Parmar\'s GitHub Profile">GitHub</a>'
  );
  
  // 5. Add title to contact section links
  content = content.replace(
    /<a href="mailto:parmarshiv1101@gmail\.com">parmarshiv1101@gmail\.com<\/a>/g,
    '<a href="mailto:parmarshiv1101@gmail.com" title="Send email to Shiv Parmar">parmarshiv1101@gmail.com</a>'
  );
  content = content.replace(
    /<a href="https:\/\/www\.linkedin\.com\/in\/shiv-parmar\/" target="_blank" rel="noopener noreferrer">linkedin\.com\/in\/shiv-parmar<\/a>/g,
    '<a href="https://www.linkedin.com/in/shiv-parmar/" target="_blank" rel="noopener noreferrer" title="Connect with Shiv Parmar on LinkedIn">linkedin.com/in/shiv-parmar</a>'
  );
  content = content.replace(
    /<a href="https:\/\/github\.com\/shivparmar1101\/shiv-parmar-portfolio" target="_blank" rel="noopener noreferrer">github\.com\/shivparmar1101<\/a>/g,
    '<a href="https://github.com/shivparmar1101/shiv-parmar-portfolio" target="_blank" rel="noopener noreferrer" title="View Shiv Parmar\'s Portfolio on GitHub">github.com/shivparmar1101</a>'
  );
  content = content.replace(
    /<a href="tel:\+917359411663">\+91 73594 11663<\/a>/g,
    '<a href="tel:+917359411663" title="Call Shiv Parmar">+91 73594 11663</a>'
  );
  
  // 6. Add title to CTA email links
  content = content.replace(
    /<a href="mailto:parmarshiv1101@gmail\.com" style="[^"]*">parmarshiv1101@gmail\.com <span>&rarr;<\/span><\/a>/g,
    '<a href="mailto:parmarshiv1101@gmail.com" style="background:var(--gradient-accent);color:#000;padding:14px 32px;border-radius:var(--radius-md);font-weight:600;font-size:14px;text-decoration:none;box-shadow:0 4px 20px rgba(201,168,76,0.3);transition:all 0.3s" title="Email Shiv Parmar for WordPress development projects">parmarshiv1101@gmail.com <span>&rarr;</span></a>'
  );
  
  // 7. Add title to "Get in Touch" CTA links
  content = content.replace(
    /<a href="mailto:parmarshiv1101@gmail\.com" style="[^"]*">Get in Touch &rarr; <span>&rarr;<\/span><\/a>/g,
    '<a href="mailto:parmarshiv1101@gmail.com" style="background:var(--gradient-accent);color:#000;padding:14px 32px;border-radius:var(--radius-md);font-weight:600;font-size:14px;text-decoration:none;box-shadow:0 4px 20px rgba(201,168,76,0.3);transition:all 0.3s" title="Get in touch with Shiv Parmar">Get in Touch &rarr; <span>&rarr;</span></a>'
  );
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`UPDATED: ${file}`);
    updated++;
  }
});

console.log(`\nDone! Updated ${updated} files.`);
