import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ComplaintsService } from './complaints.service';
import { CreateComplaintDto, ListQueryDto } from './dto';

@Controller('complaints')
export class ComplaintsController {
  constructor(private readonly svc: ComplaintsService) {}
  @Post() create(@Body() dto: CreateComplaintDto) { return this.svc.create(dto); }
  @Get() list(@Query() q: ListQueryDto) { return this.svc.list(q); }
  @Get(':id') get(@Param('id') id: string) { return this.svc.get(id); }
}