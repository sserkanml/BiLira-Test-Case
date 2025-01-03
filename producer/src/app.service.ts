import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CustomCronExpression } from './global/enums/cron';
import { ProduceService } from './produce/produce.service';


@Injectable()
export class AppService {
  private readonly logger: Logger;
   
  constructor(private readonly produceService: ProduceService) {
    this.logger = new Logger(AppService.name);
  }
  
  @Cron(CustomCronExpression.EVERY_3_SECONDS)
  async handleCron() {

    try {
      this.logger.log('Cron job is triggered');
      await this.produceService.startProducing();
      this.logger.log('Cron job is finished');
    } catch (error) {
      this.logger.error({ message: 'Error in cron job', error, level: 'error' });
    }
    finally {
    }
  }
}
