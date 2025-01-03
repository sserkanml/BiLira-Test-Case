import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiInternalServerErrorResponse, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

@Controller('user')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('messages')
  @ApiOperation({ summary: 'Get messages with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid request parameters.' })
  @ApiInternalServerErrorResponse({ description: 'Server error occurred while processing the request.' })
  @ApiQuery({ name: 'eventType', required: false, type: String, description: 'Filter by event type' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date for timestamp filter (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date for timestamp filter (YYYY-MM-DD)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number for pagination', default: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page', default: 10 })
  async getMessages(
    @Query('eventType') eventType?: string, 
    @Query('startDate') startDate?: string, 
    @Query('endDate') endDate?: string, 
    @Query('page') page = 1, 
    @Query('limit') limit = 10, 
  ) {
    const result = await this.appService.findMessages(
      eventType,
      startDate,
      endDate,
      page,
      limit,
    );

    return result;
    
  }


}
