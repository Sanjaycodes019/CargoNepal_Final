const fs = require('fs');
const path = require('path');

// Directories to scan
const directories = [
  path.join(__dirname, '..', 'controllers'),
  path.join(__dirname, '..', 'services'),
  path.join(__dirname, '..', 'middleware'),
  path.join(__dirname, '..', 'routes'),
  path.join(__dirname, '..', 'utils')
];

// Logging patterns to find
const patterns = [
  'console\.(log|info|warn|error|debug|time|timeEnd|trace|dir|dirxml|group|groupEnd|groupCollapsed|table|count|countReset|assert|profile|profileEnd|timeLog|timeStamp|context|clear)',
  'logger\.(debug|info|warn|error|http)'
];

// File extensions to check
const fileExtensions = ['.js', '.jsx', '.ts', '.tsx'];

// Results storage
const results = {
  consoleLogs: [],
  loggerCalls: [],
  filesScanned: 0,
  totalIssues: 0
};

// Recursively scan directory for files
function scanDirectory(directory) {
  const files = fs.readdirSync(directory, { withFileTypes: true });
  
  files.forEach(file => {
    const fullPath = path.join(directory, file.name);
    
    if (file.isDirectory()) {
      scanDirectory(fullPath);
    } else if (fileExtensions.includes(path.extname(file.name).toLowerCase())) {
      scanFile(fullPath);
    }
  });
}

// Scan file for logging patterns
function scanFile(filePath) {
  results.filesScanned++;
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      // Check for console.* calls
      if (line.match(new RegExp(patterns[0]))) {
        results.consoleLogs.push({
          file: filePath,
          line: lineNumber,
          code: line.trim()
        });
        results.totalIssues++;
      }
      
      // Check for logger calls to ensure they follow standards
      const loggerMatch = line.match(/logger\.(\w+)\(/);
      if (loggerMatch) {
        const logLevel = loggerMatch[1];
        
        // Check if logger call follows our standards
        if (!line.includes('{') || !line.includes('}')) {
          results.loggerCalls.push({
            file: filePath,
            line: lineNumber,
            level: logLevel,
            code: line.trim(),
            issue: 'Missing structured data object'
          });
          results.totalIssues++;
        }
      }
    });
  } catch (error) {
    console.error(`Error scanning file ${filePath}:`, error.message);
  }
}

// Generate report
function generateReport() {
  console.log('\n=== Logging Audit Report ===');
  console.log(`Scanned ${results.filesScanned} files`);
  console.log(`Found ${results.totalIssues} potential logging issues\n`);
  
  if (results.consoleLogs.length > 0) {
    console.log('=== Console Logs Found ===');
    results.consoleLogs.forEach((log, index) => {
      console.log(`\n${index + 1}. ${log.file}:${log.line}`);
      console.log(`   ${log.code}`);
    });
  }
  
  if (results.loggerCalls.length > 0) {
    console.log('\n=== Logger Issues Found ===');
    results.loggerCalls.forEach((log, index) => {
      console.log(`\n${index + 1}. ${log.file}:${log.line} (${log.level})`);
      console.log(`   Issue: ${log.issue}`);
      console.log(`   Code: ${log.code}`);
    });
  }
  
  if (results.totalIssues === 0) {
    console.log('\n✅ No logging issues found!');
  } else {
    console.log(`\n🔍 Found ${results.totalIssues} issues that need attention.`);
  }
}

// Run the audit
console.log('Starting logging audit...');
directories.forEach(dir => {
  if (fs.existsSync(dir)) {
    scanDirectory(dir);
  } else {
    console.warn(`Directory not found: ${dir}`);
  }
});

generateReport();
