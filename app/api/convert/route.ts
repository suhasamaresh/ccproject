import { NextRequest, NextResponse } from 'next/server';
import PptxGenJS from 'pptxgenjs';
import fs from 'fs';
import path from 'path';
import os from 'os';

interface ExtractedContent {
  text: string;
  images: { data: string; width: number; height: number }[];
  tables: { rows: string[][] }[];
  formatting: { font: string; size: number }[];
  pageBreaks: number[];
  numPages: number;
}

export async function POST(request: NextRequest) {
  console.log('🚀 API Route called - Starting PDF to PPTX conversion');

  try {
    console.log('📝 Parsing form data...');
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.error('❌ No file provided in request');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log(`📄 File received: ${file.name}, Size: ${file.size} bytes`);

    if (file.type !== 'application/pdf') {
      console.error(`❌ Invalid file type: ${file.type}`);
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      console.error('❌ File size exceeds 10MB limit');
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    console.log('🔄 Converting file to buffer...');
    const arrayBuffer = await file.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    console.log('🔍 Extracting content from PDF...');
    const extractedContent = await extractContentFromPDF(pdfBuffer);

    console.log('📝 Creating PPTX presentation...');
    const pptx = await createPptxFromContent(extractedContent);

    console.log('🔄 Generating PPTX buffer...');
    const pptxBuffer = await pptx.stream();

    // Ensure pptxBuffer is a Buffer or Uint8Array to access .length
    let pptxBufferData: Buffer | Uint8Array;
    if (pptxBuffer instanceof ArrayBuffer) {
      pptxBufferData = new Uint8Array(pptxBuffer);
    } else if (pptxBuffer instanceof Uint8Array || Buffer.isBuffer(pptxBuffer)) {
      pptxBufferData = pptxBuffer as Buffer | Uint8Array;
    } else if (typeof pptxBuffer === 'string') {
      pptxBufferData = Buffer.from(pptxBuffer, 'binary');
    } else if (pptxBuffer instanceof Blob) {
      pptxBufferData = new Uint8Array(await pptxBuffer.arrayBuffer());
    } else {
      throw new Error('Unknown PPTX buffer type');
    }

    console.log(`✅ PPTX buffer generated, size: ${pptxBufferData.length} bytes`);

    const filename = file.name.replace(/\.pdf$/i, '.pptx');
    console.log(`📤 Sending response with filename: ${filename}`);

    return new NextResponse(pptxBufferData, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pptxBufferData.length.toString(),
      },
    });
  } catch (error) {
    console.error('❌ Conversion error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Internal server error during conversion',
        details: errorMessage.includes('password')
          ? 'This PDF is password-protected. Please provide an unprotected PDF.'
          : errorMessage.includes('image-based')
          ? 'This PDF is image-based and requires OCR for full text extraction.'
          : errorMessage,
      },
      { status: 500 }
    );
  }
}

async function extractContentFromPDF(pdfBuffer: Buffer): Promise<ExtractedContent> {
  console.log('🔧 Starting PDF content extraction...');

  try {
    const pdf2json = await import('pdf2json');
    
    return new Promise((resolve, reject) => {
      const pdfParser = new pdf2json.default();
      
      pdfParser.on('pdfParser_dataError', (errData: any) => {
        console.error('❌ PDF Parser Error:', errData);
        reject(new Error('Failed to parse PDF. The file may be corrupted or password-protected.'));
      });

      pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
        try {
          console.log(`📖 PDF processed: ${pdfData.Pages.length} pages`);
          
          let extractedText = '';
          const pageBreaks: number[] = [];
          
          pdfData.Pages.forEach((page: any, pageIndex: number) => {
            if (pageIndex > 0) {
              pageBreaks.push(extractedText.length);
              extractedText += '\n\n--- Page Break ---\n\n';
            }
            
            if (page.Fills && page.Fills.length > 0) {
              page.Fills.forEach((fill: any) => {
                if (fill.T) {
                  extractedText += decodeURIComponent(fill.T) + ' ';
                }
              });
            }
            
            if (page.Texts && page.Texts.length > 0) {
              page.Texts.forEach((text: any) => {
                if (text.R && text.R.length > 0) {
                  text.R.forEach((r: any) => {
                    if (r.T) {
                      extractedText += decodeURIComponent(r.T) + ' ';
                    }
                  });
                }
              });
              extractedText += '\n';
            }
          });

          console.log(`📝 Text length: ${extractedText.length} characters`);

          const paragraphs = extractedText.split('\n\n').filter(p => p.trim().length > 0);
          const formatting = paragraphs.map(() => ({ font: 'Arial', size: 12 }));

          const extractedContent: ExtractedContent = {
            text: extractedText.trim(),
            images: [],
            tables: [],
            formatting: formatting,
            pageBreaks: pageBreaks,
            numPages: pdfData.Pages.length,
          };

          const tables = extractTablesFromText(extractedText);
          extractedContent.tables = tables;

          console.log(`✅ Extraction complete:`);
          console.log(`   - Text length: ${extractedContent.text.length} characters`);
          console.log(`   - Images found: ${extractedContent.images.length}`);
          console.log(`   - Tables found: ${extractedContent.tables.length}`);

          resolve(extractedContent);
        } catch (error) {
          console.error('❌ Error processing PDF data:', error);
          reject(new Error('Failed to process PDF content.'));
        }
      });

      pdfParser.parseBuffer(pdfBuffer);
    });
    
  } catch (error) {
    console.error('❌ PDF extraction failed:', error);
    console.log('🔄 Attempting fallback extraction...');
    return await fallbackTextExtraction(pdfBuffer);
  }
}

async function fallbackTextExtraction(pdfBuffer: Buffer): Promise<ExtractedContent> {
  console.log('🔄 Using fallback text extraction...');
  
  try {
    const pdfParse = await import('pdf-parse');
    
    const tempDir = os.tmpdir();
    const tempPdfPath = path.join(tempDir, `temp_${Date.now()}.pdf`);
    
    try {
      fs.writeFileSync(tempPdfPath, pdfBuffer);
      
      const data = await pdfParse.default(fs.readFileSync(tempPdfPath));
      
      fs.unlinkSync(tempPdfPath);
      
      console.log(`📖 PDF processed: ${data.numpages} pages`);
      console.log(`📝 Text length: ${data.text.length} characters`);

      const text = data.text;
      const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
      const formatting = paragraphs.map(() => ({ font: 'Arial', size: 12 }));
      
      const pageBreaks: number[] = [];
      const avgCharsPerPage = text.length / data.numpages;
      for (let i = 1; i < data.numpages; i++) {
        pageBreaks.push(Math.floor(avgCharsPerPage * i));
      }

      const extractedContent: ExtractedContent = {
        text: text,
        images: [],
        tables: extractTablesFromText(text),
        formatting: formatting,
        pageBreaks: pageBreaks,
        numPages: data.numpages,
      };

      return extractedContent;
    } catch (fileError) {
      if (fs.existsSync(tempPdfPath)) {
        fs.unlinkSync(tempPdfPath);
      }
      throw fileError;
    }
    
  } catch (error) {
    console.error('❌ All extraction methods failed:', error);
    
    return {
      text: 'Error: Could not extract text from this PDF. The file may be image-based, password-protected, or corrupted. Please try with a different PDF file.',
      images: [],
      tables: [],
      formatting: [{ font: 'Arial', size: 12 }],
      pageBreaks: [],
      numPages: 1,
    };
  }
}

function extractTablesFromText(text: string): { rows: string[][] }[] {
  const tables: { rows: string[][] }[] = [];
  
  try {
    const lines = text.split('\n');
    let currentTable: string[][] = [];
    let consecutiveTableLines = 0;
    
    for (const line of lines) {
      const words = line.trim().split(/\s{2,}/);
      
      if (words.length >= 2 && words.every(word => word.trim().length > 0)) {
        currentTable.push(words);
        consecutiveTableLines++;
      } else {
        if (currentTable.length >= 2 && consecutiveTableLines >= 2) {
          tables.push({ rows: currentTable });
        }
        currentTable = [];
        consecutiveTableLines = 0;
      }
    }
    
    if (currentTable.length >= 2 && consecutiveTableLines >= 2) {
      tables.push({ rows: currentTable });
    }
    
  } catch (error) {
    console.warn('⚠️ Table extraction error:', error);
  }
  
  return tables;
}

async function createPptxFromContent(content: ExtractedContent): Promise<PptxGenJS> {
  console.log('🔧 Creating PPTX presentation...');

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // 16:9 aspect ratio

  // Add slides based on content
  let slideCount = 0;

  if (content.text.trim().length > 0) {
    const paragraphs = content.text
      .split('\n\n')
      .filter(para => para.trim().length > 0);

    let currentSlide = pptx.addSlide();
    slideCount++;
    let textYPosition = 0.5; // Start position for text (in inches)

    for (let i = 0; i < paragraphs.length; i++) {
      const para = paragraphs[i];
      const formatting = content.formatting[i] || { font: 'Arial', size: 12 };

      if (para.includes('--- Page Break ---')) {
        currentSlide = pptx.addSlide();
        slideCount++;
        textYPosition = 0.5;
        continue;
      }

      // Add text to slide
      currentSlide.addText(para.trim(), {
        x: 0.5,
        y: textYPosition,
        w: 12,
        fontFace: formatting.font,
        fontSize: formatting.size,
        color: '000000',
        valign: 'top',
        autoFit: true,
      });

      textYPosition += (formatting.size / 12) * 0.5 + 0.2; // Adjust position for next text

      // Start new slide if content exceeds slide height (approx 7 inches)
      if (textYPosition > 7) {
        currentSlide = pptx.addSlide();
        slideCount++;
        textYPosition = 0.5;
      }
    }
  }

  // Add tables
  if (content.tables.length > 0) {
    console.log(`📊 Adding ${content.tables.length} tables to presentation`);

    for (const tableData of content.tables) {
      try {
        const currentSlide = pptx.addSlide();
        slideCount++;
        
        const tableRows = tableData.rows.map(row => 
          row.map(cell => ({
            text: cell || '',
            options: { fontFace: 'Arial', fontSize: 10, color: '000000' }
          }))
        );

        currentSlide.addTable(tableRows, {
          x: 0.5,
          y: 0.5,
          w: 12,
          colW: new Array(tableData.rows[0].length).fill(12 / tableData.rows[0].length),
          border: { pt: 1, color: '000000' },
          fill: { color: 'F5F5F5' },
          autoPage: true,
        });
      } catch (error) {
        console.warn('⚠️ Could not add table:', error);
      }
    }
  }

  // Fallback for empty presentations
  if (slideCount === 0) {
    const slide = pptx.addSlide();
    slide.addText(
      'No content could be extracted from this PDF. It may be image-based, password-protected, or corrupted.',
      {
        x: 0.5,
        y: 0.5,
        w: 12,
        fontFace: 'Arial',
        fontSize: 12,
        color: 'FF0000',
        valign: 'top',
      }
    );
    slideCount++;
  }

  return pptx;
}