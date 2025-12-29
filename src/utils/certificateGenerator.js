// File: src/utils/certificateGenerator.js
/**
 * Certificate PDF Generator using Puppeteer
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

/**
 * Convert image to base64
 */
function imageToBase64(imagePath) {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
    return `data:${mimeType};base64,${base64Image}`;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return '';
  }
}

/**
 * Generate HTML template for certificate
 */
function generateCertificateHTML(data) {
  const { recipient_name, course_title, completion_date, instructor_name, background_url } = data;

  // Convert signature images to base64
  const ttd1Path = path.join(__dirname, '../../public/images/ttd1.png');
  const ttd2Path = path.join(__dirname, '../../public/images/ttd2.png');
  
  const ttd1Base64 = imageToBase64(ttd1Path);
  const ttd2Base64 = imageToBase64(ttd2Path);

  // Format date
  const formattedDate = new Date(completion_date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Base styles
  let backgroundStyle = `background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);`;
  let containerStyle = `
      background: white;
      border: 15px solid #2c3e50;
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
    
    /* Decorative corners */
    .certificate:not(.custom-template)::before {
      content: '';
      position: absolute;
      top: 30px;
      left: 30px;
      right: 30px;
      bottom: 30px;
      border: 3px solid #d4af37;
      pointer-events: none;
    }
    
    .certificate:not(.custom-template)::after {
      content: '';
      position: absolute;
      top: 40px;
      left: 40px;
      right: 40px;
      bottom: 40px;
      border: 1px solid #d4af37;
      pointer-events: none;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    
    .logo {
      font-size: 36px;
      color: #2c3e50;
      font-weight: bold;
      margin-bottom: 5px;
      letter-spacing: 2px;
    }
    
    .certificate-title {
      font-size: 48px;
      color: #2c3e50;
      letter-spacing: 4px;
      text-transform: uppercase;
      margin-bottom: 10px;
      font-weight: 700;
      font-family: 'Times New Roman', serif;
    }
    
    .subtitle {
      font-size: 18px;
      color: #555;
      margin-bottom: 30px;
      font-style: italic;
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
      font-size: 56px;
      color: #2c3e50;
      font-weight: bold;
      margin-bottom: 30px;
      border-bottom: 3px solid #d4af37;
      padding-bottom: 10px;
      display: inline-block;
      font-family: 'Brush Script MT', cursive;
    }
    
    .achievement {
      font-size: 18px;
      color: #444;
      line-height: 1.8;
      margin-bottom: 20px;
    }
    
    .course-name {
      font-weight: bold;
      color: #2c3e50;
      font-size: 24px;
      margin-top: 10px;
    }
    
    .footer {
      display: flex;
      justify-content: space-around;
      width: 100%;
      max-width: 700px;
      margin-top: 40px;
    }
    
    .signature-block {
      text-align: center;
      min-width: 180px;
    }
    
    .signature-image {
      width: 120px;
      height: 60px;
      margin: 0 auto 5px;
    }
    
    .signature-line {
      border-top: 2px solid #2c3e50;
      width: 180px;
      margin: 0 auto 8px;
    }
    
    .date {
      font-size: 14px;
      color: #666;
      margin-bottom: 3px;
    }
    
    .instructor, .founder-name {
      font-weight: bold;
      color: #2c3e50;
      font-size: 15px;
      margin-bottom: 2px;
    }
    
    .title {
      font-size: 12px;
      color: #666;
      font-style: italic;
    }
    
    .seal {
      position: absolute;
      bottom: 40px;
      left: 60px;
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: linear-gradient(135deg, #d4af37 0%, #f4e4c1 100%);
      color: #2c3e50;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: bold;
      text-align: center;
      border: 6px solid #2c3e50;
      box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4);
    }

    .custom-template .certificate-title,
    .custom-template .logo {
        text-shadow: 2px 2px 4px rgba(255,255,255,0.8);
    }
    .custom-template .recipient-name {
         text-shadow: 2px 2px 4px rgba(255,255,255,0.8);
    }
    .custom-template .seal {
        display: none;
    }
  </style>
</head>
<body>
  <div class="certificate-container">
    <div class="certificate ${overlayClass}">
      ${!background_url ? `
      <div class="seal">
        LENTERA<br>KARIR
      </div>
      <div class="header">
        <div class="logo">LENTERA KARIR</div>
        <div class="certificate-title">Certificate of Completion</div>
        <div class="subtitle">This is to certify that</div>
      </div>
      ` : `
      <div class="header" style="margin-top: 50px;">
        <div class="certificate-title">Certificate of Completion</div>
        <div class="subtitle">This is to certify that</div>
      </div>
      `}
      
      <div class="content">
        <div class="recipient-name">${recipient_name}</div>
        
        <div class="achievement">
          has successfully completed the course
          <div class="course-name">"${course_title}"</div>
          <div style="margin-top: 15px; font-size: 16px;">on ${formattedDate}</div>
        </div>
      </div>
      
      <div class="footer">
        <div class="signature-block">
          ${ttd1Base64 ? `<img src="${ttd1Base64}" alt="Signature" class="signature-image" />` : ''}
          <div class="signature-line"></div>
          <div class="instructor">${instructor_name}</div>
          <div class="title">Instructor</div>
        </div>
        
        <div class="signature-block">
          ${ttd2Base64 ? `<img src="${ttd2Base64}" alt="Signature" class="signature-image" />` : ''}
          <div class="signature-line"></div>
          <div class="founder-name">Founder</div>
          <div class="title">Lentera Karir</div>
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
