import { Injectable } from '@nestjs/common';

const CHANNEL_ID = 'UCIbxja1EbdUKBsB9xizP4GA';
const RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

@Injectable()
export class YoutubeService {
  async getVideos() {
    try {
      const res = await fetch(RSS_URL);
      const xml = await res.text();

      const videos = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((m) => {
        const entry = m[1];
        const id = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1] ?? '';
        const title = entry.match(/<title>(.*?)<\/title>/)?.[1] ?? '';
        const published = entry.match(/<published>(.*?)<\/published>/)?.[1] ?? '';
        return {
          id,
          title,
          published,
          thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
          url: `https://www.youtube.com/watch?v=${id}`,
        };
      });

      return videos.slice(0, 6);
    } catch {
      return [];
    }
  }
}
