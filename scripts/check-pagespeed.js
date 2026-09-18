/**
 * Check Page Speed (Basic checks)
 * Checks HTML, CSS, JS for performance issues
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const REPORT_DIR = path.join(ROOT_DIR, 'reports');

function checkFilesize(filePath) {
  const stats = fs.statSync(filePath);
  return stats.size;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function checkPerformance() {
  console.log('=== Performance Check Started ===');
  
  const results = {
    files: [],
    issues: [],
    warnings: [],
    passed: [],
    totalSize: 0,
  };

  // Check HTML files
  const htmlFiles = ['index.html', 'about.html', 'services.html', 'work.html', 
                     'projects.html', 'skills.html', 'experience.html', 'blog.html', 'contact.html'];
  
  htmlFiles.forEach(file => {
    const filepath = path.join(ROOT_DIR, file);
    if (fs.existsSync(filepath)) {
      const size = checkFilesize(filepath);
      results.totalSize += size;
      
      const html = fs.readFileSync(filepath, 'utf8');
      
      // Check for render-blocking resources
      if (html.includes('<link rel="stylesheet"') && !html.includes('media="print"')) {
        results.warnings.push(`${file}: May have render-blocking CSS`);
      }
      
      // Check for async/defer on scripts
      const scriptRegex = /<script src="([^"]+)"/g;
      let match;
      while ((match = scriptRegex.exec(html)) !== null) {
        if (!match[0].includes('async') && !match[0].includes('defer')) {
          results.warnings.push(`${file}: Script ${match[1]} may be render-blocking`);
        }
      }
      
      // Check for lazy loading on images
      const imgRegex = /<img[^>]+>/g;
      let imgMatch;
      let imagesWithoutLazy = 0;
      while ((imgMatch = imgRegex.exec(html)) !== null) {
        if (!imgMatch[0].includes('loading="lazy"') && !imgMatch[0].includes('loading="eager"')) {
          imagesWithoutLazy++;
        }
      }
      if (imagesWithoutLazy > 0) {
        results.warnings.push(`${file}: ${imagesWithoutLazy} images without lazy loading`);
      }
      
      // Check for image dimensions
      let imagesWithoutDimensions = 0;
      const imgRegex2 = /<img[^>]+>/g;
      while ((imgMatch = imgRegex2.exec(html)) !== null) {
        if (!imgMatch[0].includes('width=') || !imgMatch[0].includes('height=')) {
          imagesWithoutDimensions++;
        }
      }
      if (imagesWithoutDimensions > 0) {
        results.warnings.push(`${file}: ${imagesWithoutDimensions} images without dimensions`);
      }
      
      results.files.push({
        name: file,
        size: size,
        sizeFormatted: formatBytes(size),
        issues: [],
      });
    }
  });

  // Check CSS files
  const cssFiles = ['style.css', 'liquid-glass.css'];
  cssFiles.forEach(file => {
    const filepath = path.join(ROOT_DIR, file);
    if (fs.existsSync(filepath)) {
      const size = checkFilesize(filepath);
      results.totalSize += size;
      
      if (size > 100000) { // 100KB
        results.warnings.push(`${file}: CSS file is large (${formatBytes(size)})`);
      }
      
      results.files.push({
        name: file,
        size: size,
        sizeFormatted: formatBytes(size),
      });
    }
  });

  // Check JS files
  const jsFiles = ['script.js', 'includes.js', 'particle-bg.js', 'spatial-tilt.js'];
  jsFiles.forEach(file => {
    const filepath = path.join(ROOT_DIR, file);
    if (fs.existsSync(filepath)) {
      const size = checkFilesize(filepath);
      results.totalSize += size;
      
      if (size > 50000) { // 50KB
        results.warnings.push(`${file}: JS file is large (${formatBytes(size)})`);
      }
      
      results.files.push({
        name: file,
        size: size,
        sizeFormatted: formatBytes(size),
      });
    }
  });

  // Calculate score
  let score = 100;
  score -= results.warnings.length * 5;
  score -= results.issues.length * 15;
  results.score = Math.max(0, score);
  results.totalSizeFormatted = formatBytes(results.totalSize);

  return results;
}

function main() {
  const results = checkPerformance();
  
  // Ensure report directory exists
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }

  // Save report
  const timestamp = new Date().toISOString().split('T')[0];
  const filepath = path.join(REPORT_DIR, `performance-${timestamp}.json`);
  fs.writeFileSync(filepath, JSON.stringify(results, null, 2));
  
  // Print summary
  console.log('');
  console.log('=== Performance Summary ===');
  console.log(`Total size: ${results.totalSizeFormatted}`);
  console.log(`Score: ${results.score}%`);
  console.log(`Issues: ${results.issues.length}`);
  console.log(`Warnings: ${results.warnings.length}`);
  
  if (results.warnings.length > 0) {
    console.log('');
    console.log('Warnings:');
    results.warnings.forEach((warning, i) => {
      console.log(`  ${i + 1}. ${warning}`);
    });
  }

  console.log('');
  console.log('=== Check Complete ===');
}

main();
