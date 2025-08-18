#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  // Get the last commit date
  const lastCommitDate = execSync('git log -1 --format="%ci"', { encoding: 'utf8' }).trim();
  
  // Format the date (remove quotes and format nicely)
  const cleanDate = lastCommitDate.replace(/"/g, '');
  const date = new Date(cleanDate);
  
  // Format as YYYY-MM-DD (ISO date format)
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  const formattedDate = `${year}-${month}-${day}`;

  // Create the git info object
  const gitInfo = {
    version: formattedDate
  };

  // Write to assets directory
  const assetsDir = path.join(__dirname, '..', 'src', 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  const gitInfoPath = path.join(assetsDir, 'git-info.json');
  fs.writeFileSync(gitInfoPath, JSON.stringify(gitInfo, null, 2));

  console.log('Git info generated successfully:', gitInfo.version);
} catch (error) {
  console.error('Error generating git info:', error.message);
  
  // Fallback: create a default file
  const fallbackInfo = {
    version: 'Development'
  };

  const assetsDir = path.join(__dirname, '..', 'src', 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  const gitInfoPath = path.join(assetsDir, 'git-info.json');
  fs.writeFileSync(gitInfoPath, JSON.stringify(fallbackInfo, null, 2));
  
  console.log('Fallback git info created');
}