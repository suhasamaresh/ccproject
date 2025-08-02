import { NextRequest, NextResponse } from 'next/server';
import PptxGenJS from 'pptxgenjs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    // Use pdf-parse directly for text extraction
    const extractedText = await extractTextFromPDF(pdfBuffer);

    // Create PPTX with extracted text
    const pptx = createPptxFromText(extractedText);

    // Generate PPTX buffer
    const pptxBuffer = await pptx.stream();

    // Normalize buffer type
    let pptxBufferData: Buffer | Uint8Array;
    if (pptxBuffer instanceof ArrayBuffer) {
      pptxBufferData = new Uint8Array(pptxBuffer);
    } else if (pptxBuffer instanceof Uint8Array || Buffer.isBuffer(pptxBuffer)) {
      pptxBufferData = pptxBuffer;
    } else if (typeof pptxBuffer === 'string') {
      pptxBufferData = Buffer.from(pptxBuffer, 'binary');
    } else if (pptxBuffer instanceof Blob) {
      pptxBufferData = new Uint8Array(await pptxBuffer.arrayBuffer());
    } else {
      throw new Error('Unknown PPTX buffer type');
    }

    const filename = file.name.replace(/\.pdf$/i, '.pptx');

    return new NextResponse(pptxBufferData, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pptxBufferData.length.toString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: (error instanceof Error) ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  try {
    // Dynamically import pdf-parse to avoid top-level import issues
    const pdfParse = await import('pdf-parse');

    // pdf-parse expects a Buffer or Uint8Array
    const data = await pdfParse.default(pdfBuffer);

    return data.text || '';
  } catch (error) {
    console.error('PDF text extraction failed:', error);
    throw new Error('Could not extract text from PDF. The file may be corrupted or password-protected.');
  }
}

function createPptxFromText(text: string): PptxGenJS {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // widescreen 16:9

  // Split text into paragraphs, filter empty ones
  const paragraphs = text.split('\n\n').map(p => p.trim()).filter(p => p.length > 0);

  // Create slides
  let slide = pptx.addSlide();
  let yPosition = 0.5;

  const lineHeight = 0.5; // in inches approx, adjust as needed

  for (const para of paragraphs) {
    // Add paragraph text
    slide.addText(para, {
      x: 0.5,
      y: yPosition,
      w: 11,
      fontFace: 'Arial',
      fontSize: 18,
      color: '000000',
      valign: 'top',
      autoFit: true,
    });

    yPosition += lineHeight;

    // If yPosition approaches bottom, add new slide
    if (yPosition > 7) {
      slide = pptx.addSlide();
      yPosition = 0.5;
    }
  }

  // If no paragraphs (empty text), add fallback note
  if (paragraphs.length === 0) {
    const fallbackSlide = pptx.addSlide();
    fallbackSlide.addText('No extractable text found in this PDF.', {
      x: 0.5,
      y: 1,
      w: 11,
      fontFace: 'Arial',
      fontSize: 18,
      color: 'FF0000',
      valign: 'middle',
      align: 'center',
    });
  }

  return pptx;
}
