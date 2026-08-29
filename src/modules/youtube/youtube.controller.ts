import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { Public } from '../../common/decorators/auth.decorators';
import { YoutubeService } from './youtube.service';

@Controller('v1/youtube')
export class YoutubeController {
  constructor(private readonly youtubeService: YoutubeService) {}

  @Public()
  @Get()
  async getVideos() {
    const videos = await this.youtubeService.getVideos();
    if (videos.length === 0) {
      throw new HttpException([], HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return videos;
  }
}
