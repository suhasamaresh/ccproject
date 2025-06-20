import { NextRequest, NextResponse } from 'next/server';
import { Document, Packer, Paragraph, TextRun } from 'docx';

export async function POST(request: NextRequest) {
  console.log('🚀 API Route called - Starting conversion process');
  
  try {
    console.log('📝 Parsing form data...');
    const formData = await request.formData();
    const file = formData.get('file') as File;

    console.log('✅ Form data parsed successfully');

    if (!file) {
      console.error('❌ No file provided in request');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log(`📄 File received: ${file.name}, Size: ${file.size} bytes, Type: ${file.type}`);

    if (file.type !== 'application/pdf') {
      console.error(`❌ Invalid file type: ${file.type}`);
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 }
      );
    }

    console.log('🔄 Converting file to buffer...');
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log(`✅ Buffer created, size: ${buffer.length} bytes`);

    console.log('📖 Starting PDF text extraction...');
    const extractedText = await extractTextFromPDF(buffer);
    console.log(`✅ Text extracted, length: ${extractedText.length} characters`);

    if (!extractedText || extractedText.trim().length === 0) {
      console.error('❌ No text could be extracted from PDF');
      return NextResponse.json(
        { error: 'Could not extract text from PDF. The file might be image-based or corrupted.' },
        { status: 500 }
      );
    }

    console.log('📝 Creating DOCX document...');
    // Split text into paragraphs and filter out empty lines
    const paragraphs = extractedText
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => 
        new Paragraph({
          children: [
            new TextRun({
              text: line.trim(),
              size: 24, // 12pt font
            }),
          ],
        })
      );

    console.log(`✅ Created ${paragraphs.length} paragraphs`);

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: paragraphs.length > 0 ? paragraphs : [
            new Paragraph({
              children: [
                new TextRun({
                  text: "No readable text found in the PDF file.",
                  size: 24,
                }),
              ],
            })
          ],
        },
      ],
    });

    console.log('🔄 Generating DOCX buffer...');
    const docxBuffer = await Packer.toBuffer(doc);
    console.log(`✅ DOCX buffer generated, size: ${docxBuffer.length} bytes`);

    const filename = file.name.replace('.pdf', '.docx');
    console.log(`📤 Sending response with filename: ${filename}`);

    // Return the DOCX file
    return new NextResponse(docxBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': docxBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('❌ Conversion error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        error: 'Internal server error during conversion',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  console.log('🔧 Starting PDF text extraction with pdf-parse...');
  
  try {
    // Use dynamic import to avoid SSR issues
    const pdfParse = (await import('pdf-parse')).default;
    console.log('✅ pdf-parse loaded successfully');
    
    console.log('📖 Parsing PDF buffer...');
    const data = await pdfParse(buffer, {
      // Add options for better text extraction
      max: 0, // Parse all pages
    });
    
    console.log(`✅ PDF parsed successfully:`);
    console.log(`   - Pages: ${data.numpages}`);
    console.log(`   - Text length: ${data.text.length} characters`);
    console.log(`   - First 100 chars: ${data.text.substring(0, 100)}...`);
    
    return data.text || '';
  } catch (error) {
    console.error('❌ PDF text extraction error:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    
    // Fallback: return empty string to create a basic DOCX
    console.log('⚠️ Falling back to empty text extraction');
    return 'Could not extract text from this PDF file. The file might be image-based or require OCR processing.';
  }
}