import {
  Controller,
  Get,
  Header,
  Headers,
  HttpStatus,
  Res,
} from '@nestjs/common';
import * as fs from 'fs';
import { createReadStream } from 'fs';
import { Response } from 'express';

@Controller('video')
export class VideoController {
  @Get()
  @Header('Accept-Ranges', 'bytes')
  @Header('Content-Type', 'video/mp4')
  async getStreamVideo(@Headers() headers, @Res() res: Response) {
    const videoPath = __dirname + '/test-video.mp4';

    const { size } = fs.statSync(videoPath);

    const videoRange = headers.range;

    if (videoRange) {
      const parts = videoRange.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : size - 1;
      const chunksize = end - start + 1;
      const readStreamFile = createReadStream(videoPath, {
        start,
        end,
        highWaterMark: 60,
      });

      const head = {
        'Content-Range': `bytes ${start}-${end}/${size}`,
        'Content-length': chunksize,
      };
      res.writeHead(HttpStatus.PARTIAL_CONTENT, head);
      readStreamFile.pipe(res);
    } else {
      const head = {
        'Content-Length': size,
      };

      res.writeHead(HttpStatus.OK, head);
      createReadStream(videoPath).pipe(res);
    }
  }
}
