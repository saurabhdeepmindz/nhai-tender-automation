import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { HistoricalDataController } from './historical-data.controller';
import { HistoricalDataService } from './historical-data.service';
import { HistoricalDocument } from './entities/historical-document.entity';
import { UploadHistory } from './entities/upload-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([HistoricalDocument, UploadHistory]),
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads/historical-data',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max file size
      },
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'text/csv',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/zip',
        ];
        
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Allowed: PDF, DOC, DOCX, TXT, CSV, XLS, XLSX, ZIP'), false);
        }
      },
    }),
  ],
  controllers: [HistoricalDataController],
  providers: [HistoricalDataService],
  exports: [HistoricalDataService],
})
export class HistoricalDataModule {}
