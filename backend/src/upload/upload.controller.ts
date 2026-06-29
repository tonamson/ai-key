import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ImageService } from './image.service';

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
const MAX_FILES = 10;
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

// Lọc sơ bộ theo MIME do client gửi — KHÔNG đủ tin cậy một mình,
// sharp ở ImageService mới là lớp xác thực thật (decode ảnh).
const fileFilter = (_req: any, file: Express.Multer.File, cb: (e: Error | null, ok: boolean) => void) => {
  if (!ALLOWED_MIME.includes(file.mimetype)) {
    return cb(new BadRequestException('Chỉ chấp nhận file ảnh (jpeg, png, webp, gif, avif)'), false);
  }
  cb(null, true);
};

const multerOpts = { storage: memoryStorage(), limits: { fileSize: MAX_FILE_SIZE }, fileFilter };

@Controller('upload')
export class UploadController {
  constructor(private readonly images: ImageService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file', multerOpts))
  async uploadOne(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Thiếu file');
    return this.images.processToWebp(file);
  }

  @Post('images')
  @UseInterceptors(FilesInterceptor('files', MAX_FILES, multerOpts))
  async uploadMany(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files?.length) throw new BadRequestException('Thiếu file');
    return Promise.all(files.map((f) => this.images.processToWebp(f)));
  }
}
