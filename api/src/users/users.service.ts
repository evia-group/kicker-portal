import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '../db/drizzle.module';
import type { Database } from '../db/drizzle.module';
import { users } from '../db/schema';

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async findAll() {
    return this.db
      .select({ id: users.id, name: users.name, isAdmin: users.isAdmin })
      .from(users);
  }

  async delete(id: string) {
    await this.db.delete(users).where(eq(users.id, id));
  }
}
