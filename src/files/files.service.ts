import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PublicFile } from './entities/publicFile.entity';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';
import { v4 as uuid } from 'uuid';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(PublicFile)
    private publicFileRepository: Repository<PublicFile>,
    private readonly configService: ConfigService,
  ) {}

  async uploadPublicFile(dataBuffer: Buffer, filename: string) {
    const s3 = new S3();

    const uploadResult = await s3
      .upload({
        Bucket: this.configService.get('AWS_BUCKEY_NAME'),
        Body: `product/${dataBuffer}`,
        Key: `${uuid()}-${filename}`,
      })
      .promise();

    const newFile = this.publicFileRepository.create({
      key: uploadResult.Key,
      url: uploadResult.Location,
    });

    await this.publicFileRepository.save(newFile);
    return newFile;
  }

  async deletePublicFile(fileId: string) {
    const file = await this.publicFileRepository.findOneBy({ id: fileId });

    const s3 = new S3();

    await s3
      .deleteObject({
        Bucket: this.configService.get('AWS_BUCKEY_NAME'),
        Key: file.key,
      })
      .promise();

    await this.publicFileRepository.delete(fileId);
  }
}
