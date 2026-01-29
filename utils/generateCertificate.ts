import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
/**
 * Generate Certificate PDF with dynamic content
 * @param {Object} data - Certificate data
 * @param {string} data.studentName - Student's name
 * @param {string} data.testName - Test name (e.g., "Railway group D mock test 2025")
 * @param {string} data.conductedBy - Organization name
 * @param {number} data.groupRank - Group rank number
 * @param {number} data.totalGroupStudents - Total students in group
 * @param {number} data.allIndiaRank - All India rank
 * @param {number} data.totalStudents - Total students nationwide
 * @param {string} data.groupMatch - Group vs Group match result or "N/A"
 * @param {number} data.score - Student's score
 * @param {number} data.maxScore - Maximum score
 * @param {string} data.performance - Performance description
 * @param {string} data.date - Certificate date
 * @param {string} logoPath - Path to logo image (PNG or JPEG only, SVG not supported)
 * @returns {Promise<Buffer>} PDF buffer
 */

export interface CertificateData {
  studentName: string;
  testName: string;
  conductedBy: string;
  groupRank: number;
  totalGroupStudents: number;
  allIndiaRank: number;
  totalStudents: number;
  groupMatch: string;
  score: number;
  maxScore: number;
  performance: string;
  date: string;
}

export async function generateCertificate(
  data: CertificateData,
  logoPath?: string,
): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'portrait',
      margin: 40,
    });

    const buffers: Buffer[] = [];
    doc.on('data', (chunk) => buffers.push(chunk as Buffer));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve(pdfBuffer);
    });

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    // Background base
    doc.rect(0, 0, pageWidth, pageHeight).fill('#ffffff');

    // Light repeating background pattern with small leaf/plant motif
    const drawBackgroundPattern = () => {
      doc.save();
      const spacing = 50;
      doc.fillColor('#b8c5e0').opacity(0.25);
      
      for (let y = 30; y < pageHeight - 30; y += spacing) {
        for (let x = 30; x < pageWidth - 30; x += spacing) {
          // Draw a simple leaf/plant icon pattern
          doc.save();
          doc.translate(x, y);
          
          // Stem
          doc.moveTo(0, 0).lineTo(0, 8).lineWidth(0.5).stroke('#b8c5e0');
          
          // Leaves (simplified)
          doc.moveTo(0, 2).bezierCurveTo(-3, 2, -4, 4, -3, 6).lineWidth(0.5).stroke('#b8c5e0');
          doc.moveTo(0, 2).bezierCurveTo(3, 2, 4, 4, 3, 6).lineWidth(0.5).stroke('#b8c5e0');
          doc.moveTo(0, 5).bezierCurveTo(-2, 5, -3, 6, -2, 8).lineWidth(0.5).stroke('#b8c5e0');
          doc.moveTo(0, 5).bezierCurveTo(2, 5, 3, 6, 2, 8).lineWidth(0.5).stroke('#b8c5e0');
          
          doc.restore();
        }
      }
      doc.opacity(1).restore();
    };
    drawBackgroundPattern();

    // Borders (outer + inner) - matching the design
    const borderPadding = 15;
    doc
      .roundedRect(
        borderPadding,
        borderPadding,
        pageWidth - borderPadding * 2,
        pageHeight - borderPadding * 2,
        8,
      )
      .lineWidth(2.5)
      .stroke('#c9c9c9');

    doc
      .roundedRect(
        borderPadding + 6,
        borderPadding + 6,
        pageWidth - (borderPadding + 6) * 2,
        pageHeight - (borderPadding + 6) * 2,
        6,
      )
      .lineWidth(1)
      .stroke('#d9d9d9');

    const topY = 60;
    const colors = {
      heading: '#000000',
      subHeading: '#2c3e50',
      primaryBlue: '#2b5a9e',
      testNameBlue: '#6b9bd1',
      green: '#27ae60',
      orange: '#ff8c00',
      gray: '#333333',
      dark: '#000000',
    };

    // Helper function to center text
    const center = (
      y: number,
      text: string,
      font = 'Helvetica',
      size = 12,
      color = colors.subHeading,
    ) => {
      doc
        .fillColor(color)
        .fontSize(size)
        .font(font)
        .text(text, 0, y, { align: 'center' });
    };

    // Logo rendering - PDFKit only supports PNG and JPEG, not SVG
    // If SVG is provided, we need to convert it or use a PNG/JPEG version
    let logoRendered = false;
    if (logoPath) {
      const resolvedLogo = path.isAbsolute(logoPath)
        ? logoPath
        : path.join(process.cwd(), logoPath);
      
      // Check if it's an SVG file and suggest PNG/JPEG alternative
      const ext = path.extname(resolvedLogo).toLowerCase();
      
      if (ext === '.svg') {
        // Try to find a PNG or JPEG version in the same directory
        const basePath = resolvedLogo.replace(/\.svg$/i, '');
        const alternatives = [
          `${basePath}.png`,
          `${basePath}.jpg`,
          `${basePath}.jpeg`,
          resolvedLogo.replace(/\.svg$/i, '.png'),
          resolvedLogo.replace(/\.svg$/i, '.jpg'),
        ];
        
        for (const altPath of alternatives) {
          if (fs.existsSync(altPath)) {
            try {
              const logoWidth = 120;
              const logoHeight = 80;
              doc.image(altPath, (pageWidth - logoWidth) / 2, topY, {
                width: logoWidth,
                height: logoHeight,
                align: 'center',
              });
              logoRendered = true;
              break;
            } catch (error) {
              console.error(`Failed to render logo from ${altPath}:`, error);
            }
          }
        }
      } else if (fs.existsSync(resolvedLogo) && (ext === '.png' || ext === '.jpg' || ext === '.jpeg')) {
        try {
          const logoWidth = 120;
          const logoHeight = 80;
          doc.image(resolvedLogo, (pageWidth - logoWidth) / 2, topY, {
            width: logoWidth,
            height: logoHeight,
            align: 'center',
          });
          logoRendered = true;
        } catch (error) {
          console.error(`Failed to render logo:`, error);
        }
      }
    }

    // Main Heading
    center(
      topY + (logoRendered ? 95 : 20),
      'CLASSMATE TEST CERTIFICATE OF ACHIEVEMENT',
      'Helvetica-Bold',
      20,
      colors.heading,
    );

    // "THIS PRESENTED TO"
    center(
      topY + (logoRendered ? 125 : 50),
      'THIS PRESENTED TO',
      'Helvetica-Oblique',
      11,
      colors.gray,
    );

    // Student Name
    center(
      topY + (logoRendered ? 150 : 75),
      (data?.studentName || 'N/A').toUpperCase(),
      'Helvetica-Bold',
      28,
      colors.primaryBlue,
    );

    // Description text
    const descY = topY + (logoRendered ? 185 : 110);
    
    // "Who participated in the" text
    const participatedText = 'Who participated in the ';
    const testNameText = data?.testName || 'N/A';
    const conductedByText = ' conducted by';
    
    // Calculate text widths for inline styling
    doc.fontSize(11).font('Helvetica');
    const participatedWidth = doc.widthOfString(participatedText);
    doc.font('Helvetica-Oblique');
    const testNameWidth = doc.widthOfString(testNameText);
    doc.font('Helvetica');
    const conductedWidth = doc.widthOfString(conductedByText);
    
    const totalWidth = participatedWidth + testNameWidth + conductedWidth;
    const startX = (pageWidth - totalWidth) / 2;
    
    // Render the line with mixed styles
    doc.fillColor(colors.gray).fontSize(11).font('Helvetica');
    doc.text(participatedText, startX, descY, { continued: true, lineBreak: false });
    
    doc.fillColor(colors.testNameBlue).font('Helvetica-Oblique');
    doc.text(testNameText, { continued: true, lineBreak: false });
    
    doc.fillColor(colors.gray).font('Helvetica');
    doc.text(conductedByText);

    // Organization name
    center(
      descY + 20,
      data?.conductedBy || 'N/A',
      'Helvetica-Bold',
      15,
      colors.green,
    );
    
    // Achievement text
    center(
      descY + 42,
      'He / She achieved outstanding performance.',
      'Helvetica',
      11,
      colors.gray,
    );

    // Stats section (two columns)
    const sectionY = descY + 75;
    const leftX = 75;
    const rightX = pageWidth / 2 + 25;
    
    const label = (text: string, x: number, y: number) => {
      doc
        .fillColor(colors.primaryBlue)
        .font('Helvetica-Bold')
        .fontSize(12)
        .text(text, x, y);
    };
    
    const value = (text: string, x: number, y: number) => {
      doc
        .fillColor(colors.dark)
        .font('Helvetica-Bold')
        .fontSize(11)
        .text(text, x, y);
    };

    // Left column
    label('GROUP RANK:', leftX, sectionY);
    value(
      `${data?.groupRank ?? 'N/A'} OUT OF ${data?.totalGroupStudents ?? 'N/A'}`,
      leftX,
      sectionY + 18,
    );

    label('ALL INDIA RANK:', leftX, sectionY + 48);
    value(
      `${data?.allIndiaRank ?? 'N/A'} OUT OF ${data?.totalStudents ?? 'N/A'}`,
      leftX,
      sectionY + 66,
    );

    label('GROUP VS GROUP', leftX, sectionY + 96);
    value(`MATCH: ${data?.groupMatch || 'N/A'}`, leftX, sectionY + 114);

    // Right column
    label('YOUR SCORE:', rightX, sectionY);
    doc
      .fillColor(colors.dark)
      .font('Helvetica-Bold')
      .fontSize(24)
      .text(
        `${data?.score ?? 'N/A'}/${data?.maxScore ?? 'N/A'}`,
        rightX,
        sectionY + 18,
      );

    label('PERFORMANCE IN:', rightX, sectionY + 55);
    doc
      .fillColor(colors.dark)
      .font('Helvetica-Bold')
      .fontSize(12)
      .text((data?.performance || 'N/A').toUpperCase(), rightX, sectionY + 73);

    // Date
    value(`DATE: ${data?.date || 'N/A'}`, rightX, sectionY + 114);

    // Footer
    doc
      .fillColor(colors.orange)
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(
        'PROVIDE BY CLASSMATE TEST – INDIA\'S MOST FLEXIBLE PLATFORM FOR ONLINE TEST',
        0,
        pageHeight - 65,
        { align: 'center' },
      );

    // QR Code placeholder (bottom-left)
    const qrX = 45;
    const qrY = pageHeight - 145;
    const qrSize = 80;
    doc.roundedRect(qrX, qrY, qrSize, qrSize, 4).lineWidth(1.5).stroke('#999999');
    doc
      .fillColor(colors.gray)
      .fontSize(8)
      .font('Helvetica-Bold')
      .text('SCAN TO', qrX, qrY - 20, { width: qrSize, align: 'center' })
      .text('DOWNLOAD', qrX, qrY - 11, { width: qrSize, align: 'center' })
      .text('THE APP', qrX, qrY - 2, { width: qrSize, align: 'center' });

    doc.end();
  });
}
