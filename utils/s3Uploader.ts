import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as crypto from 'crypto';

@Injectable()
export class S3UploadService {
  private s3Client = new S3Client({
    credentials: {
      accessKeyId: process.env.AWS_S3_ACCESS_KEY!,
      secretAccessKey: process.env.AWS_S3_SECRET_KEY!,
    },
    region: process.env.AWS_S3_REGION,
  });

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads',
  ): Promise<string> {
    try {
      const bucket = process.env.AWS_S3_BUCKET;
      const fileName = `${folder}/${crypto.randomUUID()}_${Date.now()}`;

      const params = {
        Bucket: bucket,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      const command = new PutObjectCommand(params);
      await this.s3Client.send(command);

      return `https://${bucket}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${fileName}`;
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw new HttpException(
        'File upload failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getPresignedUrl(
    folder: string = 'uploads',
    contentType: string,
  ): Promise<{ url: string; key: string }> {
    try {
      const bucket = process.env.AWS_S3_BUCKET;
      const fileName = `${folder}/${crypto.randomUUID()}_${Date.now()}`;

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: fileName,
        ContentType: contentType,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });

      return {
        url,
        key: `https://${bucket}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${fileName}`,
      };
    } catch (error) {
      console.error('Error generating pre-signed URL:', error);
      throw new HttpException(
        'Could not generate pre-signed URL',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
