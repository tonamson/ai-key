import { Module } from '@nestjs/common';
import { ImageService } from './image.service';
import { UploadController } from './upload.controller';

@Module({
  controllers: [UploadController],
  providers: [ImageService],
  exports: [ImageService],
})
export class UploadModule {}
