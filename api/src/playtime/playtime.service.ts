import { Inject, Injectable } from '@nestjs/common';
import { desc } from 'drizzle-orm';
import { DRIZZLE } from '../db/drizzle.module';
import type { Database } from '../db/drizzle.module';
import { playtime } from '../db/schema';

@Injectable()
export class PlaytimeService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async findAll() {
    return this.db.select().from(playtime).orderBy(desc(playtime.startTime));
  }

  async create(startTime: Date, endTime: Date) {
    const [created] = await this.db
      .insert(playtime)
      .values({ startTime, endTime })
      .returning();
    return created;
  }
}
