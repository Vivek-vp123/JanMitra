import { IsArray, IsIn, IsNotEmpty, IsOptional, IsString, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

class LocationDto { @IsNumber() lat!: number; @IsNumber() lng!: number; }

export class CreateComplaintDto {
  @IsString() @IsNotEmpty() societyId!: string;
  @IsString() @IsNotEmpty() category!: string;
  @IsString() @IsOptional() subcategory?: string;
  @IsString() @IsOptional() description?: string;
  @IsArray() @IsOptional() media?: string[];
  @ValidateNested() @Type(() => LocationDto) @IsOptional() location?: LocationDto;
  @IsString() @IsOptional() reporterId?: string; // temp until Auth0
}

export class ListQueryDto {
  @IsString() @IsOptional() societyId?: string;
  @IsString() @IsOptional() orgId?: string;
  @IsIn(['open','assigned','in_progress','resolved','closed']) @IsOptional()
  status?: 'open'|'assigned'|'in_progress'|'resolved'|'closed';
}