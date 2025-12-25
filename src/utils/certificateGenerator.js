// File: src/utils/certificateGenerator.js
/**
 * Certificate PDF Generator using Puppeteer
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

/**
 * Generate HTML template for certificate
 */
function generateCertificateHTML(data) {
  const { recipient_name, course_title, completion_date, instructor_name, background_url } = data;

  // Format date
  const formattedDate = new Date(completion_date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Base styles
  let backgroundStyle = `background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);`;
  let containerStyle = `
      background: white;
      border: 15px solid #f4f4f4;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  `;
  let overlayClass = '';

  // Override if template is provided
  if (background_url) {
    backgroundStyle = `
        background-image: url('${background_url}');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
      `;
    // Remove default border and white bg if using template
    containerStyle = `
        background: transparent;
        border: none;
        box-shadow: none;
      `;
    overlayClass = 'custom-template';
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: A4 landscape;
      margin: 0;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Georgia', serif;
      width: 297mm;
      height: 210mm;
      margin: 0;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      /* Body background (outside paper in browser) */
      background: #eee; 
    }
    
    .certificate-container {
       width: 297mm;
       height: 210mm;
       padding: 20mm;
       display: flex;
       align-items: center;
       justify-content: center;
       ${backgroundStyle}
    }

    .certificate {
      width: 100%;
      height: 100%;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      ${containerStyle}
    }
    
    /* Default Styles (Only apply if NOT custom template to avoid clashing) */
    .certificate:not(.custom-template)::before {
      content: '';
      position: absolute;
      top: 20px;
      left: 20px;
      right: 20px;
      bottom: 20px;
      border: 2px solid #6B21FF;
      pointer-events: none;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    
    .logo {
      font-size: 48px;
      color: #6B21FF;
      font-weight: bold;
      margin-bottom: 10px;
    }
    
    .certificate-title {
      font-size: 42px;
      color: #333;
      letter-spacing: 3px;
      text-transform: uppercase;
      margin-bottom: 10px;
      font-weight: 600;
    }
    
    .subtitle {
      font-size: 18px;
      color: #666;
      margin-bottom: 40px;
    }
    
    .content {
      text-align: center;
      max-width: 800px;
    }
    
    .presented-to {
      font-size: 16px;
      color: #666;
      margin-bottom: 15px;
    }
    
    .recipient-name {
      font-size: 52px;
      color: #6B21FF;
      font-weight: bold;
      margin-bottom: 30px;
      border-bottom: 3px solid #6B21FF;
      padding-bottom: 10px;
      display: inline-block;
    }
    
    .achievement {
      font-size: 18px;
      color: #444;
      line-height: 1.8;
      margin-bottom: 30px;
    }
    
    .course-name {
      font-weight: bold;
      color: #6B21FF;
      font-size: 22px;
    }
    
    .footer {
      display: flex;
      justify-content: space-between;
      width: 100%;
      max-width: 600px;
      margin-top: 50px;
    }
    
    .signature-block {
      text-align: center;
    }
    
    .signature-line {
      border-top: 2px solid #333;
      width: 200px;
      margin: 0 auto 10px;
    }
    
    .date, .instructor {
      font-size: 14px;
      color: #666;
    }
    
    .instructor {
      font-weight: bold;
      color: #333;
    }
    
    /* Helper for Custom Template: 
       If using custom template, we might want to hide default logo/seal 
       if the template already has them. 
       For now, we keep text overlay clean.
    */
    .custom-template .seal {
        display: none; /* Hide default seal if custom template */
    }
    
    .custom-template .certificate-title,
    .custom-template .logo {
        /* Optional: Hide title/logo if template has it? 
           For flexible usage, let's keep them but maybe adjust colors?
           Let's assume template is just a border/background design.
        */
        text-shadow: 2px 2px 4px rgba(255,255,255,0.8);
    }
    .custom-template .recipient-name {
         text-shadow: 2px 2px 4px rgba(255,255,255,0.8);
    }

    .seal {
      position: absolute;
      bottom: 40px;
      left: 60px;
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: #6B21FF;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      text-align: center;
      border: 5px solid #f4f4f4;
      box-shadow: 0 4px 15px rgba(107, 33, 255, 0.3);
    }
  </style>
</head>
<body>
  <div class="certificate-container">
    <div class="certificate ${overlayClass}">
      ${!background_url ? `
      <div class="seal">
        OFFICIAL<br>SEAL
      </div>
      <div class="header">
        <div class="logo">LENTERA KARIR</div>
        <div class="certificate-title">Certificate of Achievement</div>
        <div class="subtitle">This certificate is proudly presented to</div>
      </div>
      ` : `
      <!-- Simplified Header for Custom Template -->
      <div class="header" style="margin-top: 50px;">
        <div class="certificate-title">Certificate of Achievement</div>
        <div class="subtitle">This certificate is proudly presented to</div>
      </div>
      `}
      
      <div class="content">
        <div class="recipient-name">${recipient_name}</div>
        
        <div class="achievement">
          For successfully completing the course
          <div class="course-name">${course_title}</div>
          on ${formattedDate}
        </div>
      </div>
      
      <div class="footer">
        <div class="signature-block">
          <div class="signature-line"></div>
          <div class="date">${formattedDate}</div>
          <div style="font-size: 12px; color: #333;">Date of Completion</div>
        </div>
        
        <div class="signature-block">
          <div class="signature-line"></div>
          <div class="instructor">${instructor_name}</div>
          <div style="font-size: 12px; color: #333;">Instructor</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate Certificate PDF
 * @param {Object} certificateData - Data for certificate
 * @param {string} outputPath - Path to save PDF
 */
async function generateCertificatePDF(certificateData, outputPath) {
  let browser;

  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Generate HTML content
    const htmlContent = generateCertificateHTML(certificateData);

    // Set content
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0'
    });

    // Generate PDF
    await page.pdf({
      path: outputPath,
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      }
    });

    // Verify file was created and has content
    const fs = require('fs');
    if (!fs.existsSync(outputPath)) {
      throw new Error('PDF file was not created');
    }

    const stats = fs.statSync(outputPath);
    if (stats.size === 0) {
      throw new Error('PDF file is empty');
    }

    console.log(`✅ Certificate PDF generated: ${outputPath} (${stats.size} bytes)`);

    return outputPath;

  } catch (error) {
    console.error('Error generating certificate PDF:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Generate Certificate PNG
 * @param {Object} certificateData - Data for certificate
 * @param {string} outputPath - Path to save PNG
 */
async function generateCertificatePNG(certificateData, outputPath) {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Set viewport for A4 landscape (1122 x 794 pixels at 96 DPI)
    await page.setViewport({
      width: 1122,
      height: 794,
      deviceScaleFactor: 2 // For better quality
    });

    const htmlContent = generateCertificateHTML(certificateData);

    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0'
    });

    // Take screenshot
    await page.screenshot({
      path: outputPath,
      type: 'png',
      fullPage: true
    });

    // Verify file was created and has content
    const fs = require('fs');
    if (!fs.existsSync(outputPath)) {
      throw new Error('PNG file was not created');
    }

    const stats = fs.statSync(outputPath);
    if (stats.size === 0) {
      throw new Error('PNG file is empty');
    }

    console.log(`✅ Certificate PNG generated: ${outputPath} (${stats.size} bytes)`);

    return outputPath;

  } catch (error) {
    console.error('Error generating certificate PNG:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = {
  generateCertificatePDF,
  generateCertificatePNG
};
