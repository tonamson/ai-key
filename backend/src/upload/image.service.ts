import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

const MAX_DIMENSION = 4000; // px — chống ảnh "bom nén" (decompression bomb)

@Injectable()
export class ImageService {
  private readonly dir: string;

  constructor(config: ConfigService) {
    this.dir = config.get<string>('UPLOAD_DIR') ?? 'uploads';
  }

  /**
   * Xác thực buffer THẬT SỰ là ảnh (bằng cách decode, không tin Content-Type),
   * re-encode sang WebP để loại metadata/payload ẩn, rồi lưu với tên ngẫu nhiên.
   * Trả về đường dẫn tương đối để lưu DB.
   */
  async processToWebp(file: Express.Multer.File): Promise<{ filename: string; path: string; size: number }> {
    if (!file?.buffer?.length) throw new BadRequestException('File rỗng');

    // sharp({ limitInputPixels }) chặn decompression bomb; failOn buộc lỗi ngay nếu không phải ảnh hợp lệ
    const pipeline = sharp(file.buffer, { failOn: 'error', limitInputPixels: 50_000_000 });

    let meta: sharp.Metadata;
    try {
      meta = await pipeline.metadata();
    } catch {
      throw new BadRequestException('File không phải ảnh hợp lệ');
    }

    // sharp chỉ set format khi nhận diện được codec ảnh thật → chặn file giả đuôi / polyglot
    if (!meta.format || !meta.width || !meta.height) {
      throw new BadRequestException('Không nhận diện được định dạng ảnh');
    }

    // Chặn SVG: vector format, decode (librsvg) có rủi ro đọc external ref/file. Chỉ nhận ảnh raster.
    if (meta.format === 'svg') {
      throw new BadRequestException('Không chấp nhận ảnh vector (SVG)');
    }

    const webp = await pipeline
      .rotate() // tôn trọng EXIF orientation trước khi strip metadata
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const filename = `${randomUUID()}.webp`;
    await mkdir(this.dir, { recursive: true });
    await writeFile(join(this.dir, filename), webp);

    return { filename, path: `/${this.dir}/${filename}`, size: webp.length };
  }
}
