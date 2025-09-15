import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Complaint, ComplaintEvent } from './complaint.schema';
import { CreateComplaintDto, ListQueryDto } from './dto';
import { EventsGateway } from '../realtime/events.gateway';

@Injectable()
export class ComplaintsService {
  constructor(
    @InjectModel(Complaint.name) private complaintModel: Model<Complaint>,
    @InjectModel(ComplaintEvent.name) private eventModel: Model<ComplaintEvent>,
    private readonly events: EventsGateway,
  ) {}

  async create(dto: CreateComplaintDto) {
    const reporterId = dto.reporterId ?? 'u-dev-1'; // dev-only
    const doc = await this.complaintModel.create({
      reporterId, societyId: dto.societyId, category: dto.category,
      subcategory: dto.subcategory, description: dto.description, media: dto.media, location: dto.location,
      status: 'open', priority: 'med',
    });
    await this.eventModel.create({ complaintId: String(doc._id), type: 'created', actorId: reporterId, payload: { category: doc.category } });
    
    this.events.emitComplaintCreated(doc);
    
    return doc;
  }

  async list(q: ListQueryDto) {
    const filter: any = {};
    if (q.societyId) filter.societyId = q.societyId;
    if (q.orgId) filter.orgId = q.orgId;
    if (q.status) filter.status = q.status;
    return this.complaintModel.find(filter).sort({ createdAt: -1 }).limit(100).lean();
  }

  async get(id: string) { return this.complaintModel.findById(id).lean(); }
}