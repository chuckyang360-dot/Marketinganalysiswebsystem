import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScrapeDoService } from './scraping/scrape-do.service';
import { InputRouterService } from './workspace/input-router.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [ScrapeDoService, InputRouterService],
})
export class AppModule {}

