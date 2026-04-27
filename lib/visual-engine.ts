import sharp from 'sharp';
import path from 'path';

export class VisualEngine {
  private templatesDir: string;
  private outputDir: string;

  constructor() {
    this.templatesDir = path.join(process.cwd(), 'templates');
    this.outputDir = path.join(process.cwd(), 'public', 'outputs');
    if (!require('fs').existsSync(this.outputDir)) {
      require('fs').mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Process a brand template with a product image and brand text
   */
  async generateSocialPost(templateName: string, productPath: string, itemName: string) {
    const templatePath = path.join(this.templatesDir, templateName);
    const outputPath = path.join(this.outputDir, `post-${Date.now()}.png`);

    try {
      // 1. Load the luxury template
      const base = sharp(templatePath);
      const metadata = await base.metadata();

      // 2. Composite the product image in the center
      // We assume product image is transparent or we circle-mask it
      const overlay = await sharp(productPath)
        .resize(600, 600, { fit: 'inside' })
        .toBuffer();

      // 3. Create a text overlay using SVG (Sharp supports SVG buffers for high-quality text)
      const svgText = `
        <svg width="${metadata.width}" height="${metadata.height}">
          <style>
            .loc { fill: #ffffff; font-family: 'Inter', sans-serif; font-size: 24px; opacity: 0.6; }
          </style>
          <text x="50%" y="90%" text-anchor="middle" class="loc">TRC KERUEN, ASTANA</text>
          <text x="50%" y="80%" text-anchor="middle" class="loc" style="font-size: 18px;">${itemName.toUpperCase()}</text>
        </svg>
      `;

      await base
        .composite([
          { input: overlay, gravity: 'center' },
          { input: Buffer.from(svgText), top: 0, left: 0 }
        ])
        .toFile(outputPath);

      return outputPath;
    } catch (error) {
      console.error('Visual Engine Error:', error);
      throw error;
    }
  }

  /**
   * Generate a creative image with custom text, background, and button
   */
  async generateCreative(options: {
    size: 'post' | 'story',
    bg: string,
    bgImage?: string | null,
    logoImage?: string | null,
    font: string,
    logo: string,
    buttonText: string,
    mainText: string,
    logoScale?: number,
    positions?: {
      logo: { x: number, y: number },
      text: { x: number, y: number },
      button: { x: number, y: number }
    }
  }) {
    const width = 1080;
    const height = options.size === 'story' ? 1920 : 1080;
    const outputPath = path.join(this.outputDir, `creative-${Date.now()}.png`);

    // Map background names to colors
    const bgMap: Record<string, string> = {
      black: '#000000',
      white: '#FFFFFF',
      gold: '#D4AF37',
      marble: '#F5F5F5',
      silk: '#1A1A1A'
    };

    const bgColor = bgMap[options.bg] || '#000000';
    const textColor = (options.bg === 'white' || options.bg === 'marble') ? '#000000' : '#FFFFFF';
    const buttonBg = (options.bg === 'white') ? '#000000' : '#D4AF37';
    const buttonTextColor = (options.bg === 'white') ? '#FFFFFF' : '#000000';
    const logoColor = options.logo === 'gold' ? '#D4AF37' : textColor;

    const composites: any[] = [];

    // Background Image
    if (options.bgImage) {
      const bgBuffer = Buffer.from(options.bgImage.split(',')[1], 'base64');
      composites.push({
        input: await sharp(bgBuffer).resize(width, height, { fit: 'cover' }).toBuffer(),
        top: 0,
        left: 0
      });
    }

    // Custom Logo
    if (options.logoImage) {
      const logoBuffer = Buffer.from(options.logoImage.split(',')[1], 'base64');
      const scale = options.logoScale || 1;
      const logoOverlay = await sharp(logoBuffer).resize(Math.round(300 * scale), Math.round(100 * scale), { fit: 'inside' }).toBuffer();
      // Adjust position based on drag (normalized roughly)
      const top = options.positions?.logo.y ? Math.max(0, Math.min(height - 100, 100 + options.positions.logo.y)) : 100;
      const left = options.positions?.logo.x ? Math.max(0, Math.min(width - 300, width / 2 - 150 + options.positions.logo.x)) : width / 2 - 150;
      composites.push({ input: logoOverlay, top: Math.round(top), left: Math.round(left) });
    }

    // SVG for text and graphics
    const logoY = options.positions?.logo.y ? 10 + (options.positions.logo.y / height) * 100 : 10;
    const textY = options.positions?.text.y ? 40 + (options.positions.text.y / height) * 100 : 40;
    const buttonY = options.positions?.button.y ? 90 + (options.positions.button.y / height) * 100 : 90;

    const logoX_Offset = options.positions?.logo.x || 0;
    const textX_Offset = options.positions?.text.x || 0;
    const buttonX_Offset = options.positions?.button.x || 0;

    const logoScale = options.logoScale || 1;

    const svgText = `
      <svg width="${width}" height="${height}">
        <style>
          .main-text { fill: ${textColor}; font-family: '${options.font}', 'Times New Roman', 'serif'; font-size: 80px; font-weight: bold; }
          .logo-text { fill: ${logoColor}; font-family: 'Times New Roman', 'serif'; font-size: ${40 * logoScale}px; font-weight: bold; letter-spacing: ${10 * logoScale}px; }
          .btn-bg { fill: ${buttonBg}; }
          .btn-text { fill: ${buttonTextColor}; font-family: 'Arial', 'sans-serif'; font-size: 30px; font-weight: bold; letter-spacing: 2px; }
        </style>
        
        ${!options.logoImage ? `<text x="50%" y="${logoY}%" text-anchor="middle" class="logo-text" transform="translate(${logoX_Offset}, 0)">TOMIORI</text>` : ''}
        
        <text x="50%" y="${textY}%" text-anchor="middle" class="main-text" transform="translate(${textX_Offset}, 0)">${options.mainText}</text>
        
        <rect x="${width / 2 - 200 + buttonX_Offset}" y="${(buttonY / 100) * height - 40}" width="400" height="80" rx="0" class="btn-bg" />
        <text x="50%" y="${(buttonY / 100) * height + 10}" text-anchor="middle" class="btn-text" transform="translate(${buttonX_Offset}, 0)">${options.buttonText.toUpperCase()}</text>
      </svg>
    `;

    composites.push({ input: Buffer.from(svgText), top: 0, left: 0 });

    try {
      await sharp({
        create: {
          width,
          height,
          channels: 4,
          background: bgColor
        }
      })
      .composite(composites)
      .toFile(outputPath);

      return outputPath;
    } catch (error) {
      console.error('Creative Generation Error:', error);
      throw error;
    }
  }
}
