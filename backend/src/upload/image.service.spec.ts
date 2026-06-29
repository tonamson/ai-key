import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import { rm, readFile } from 'fs/promises';
import { join } from 'path';
import { ImageService } from './image.service';

const TEST_DIR = 'uploads-test';
const cfg = { get: () => TEST_DIR } as unknown as ConfigService;

const fakeFile = (buffer: Buffer): Express.Multer.File =>
  ({ buffer, mimetype: 'image/png', originalname: 'x.png' } as Express.Multer.File);

describe('ImageService', () => {
  const service = new ImageService(cfg);

  afterAll(() => rm(TEST_DIR, { recursive: true, force: true }));

  it('converts a real image to webp on disk', async () => {
    const png = await sharp({ create: { width: 20, height: 10, channels: 3, background: 'red' } })
      .png()
      .toBuffer();

    const res = await service.processToWebp(fakeFile(png));

    expect(res.filename).toMatch(/\.webp$/);
    expect(res.path).toBe(`/${TEST_DIR}/${res.filename}`);

    const saved = await readFile(join(TEST_DIR, res.filename));
    expect((await sharp(saved).metadata()).format).toBe('webp'); // thật sự là webp
  });

  it('rejects a non-image file disguised with image mimetype', async () => {
    const evil = Buffer.from('<?php system($_GET["c"]); ?>');
    await expect(service.processToWebp(fakeFile(evil))).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an empty buffer', async () => {
    await expect(service.processToWebp(fakeFile(Buffer.alloc(0)))).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects SVG (vector) even if decodable', async () => {
    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="red"/></svg>',
    );
    await expect(service.processToWebp(fakeFile(svg))).rejects.toBeInstanceOf(BadRequestException);
  });
});
