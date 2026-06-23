import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './models/user.model';
import { Model } from 'mongoose';
import fs from 'node:fs/promises';
import path from 'node:path';
import { ChangeRoleDto } from './dtos';
import { UserRole } from '@/common/enums/role.enum';
import bcrypt from 'bcryptjs';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'user-profile');

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(@InjectModel(User.name) private readonly model: Model<User>) {}

  async onModuleInit() {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await this.createAdminIfNotExist();
  }

  async createAdminIfNotExist(): Promise<void> {
  const adminEmail = 'admin@library.com';

  const existingAdmin = await this.model.findOne({ email: adminEmail });

  if (!existingAdmin) {
    const hashedPassword = await this.hashPass('AdminPassword123');

    await this.model.create({
      email: adminEmail,
      fullName: 'System Administrator',
      password: hashedPassword,
      role: UserRole.ADMIN,
      isActive: true,
    });

    console.log('✅ Default admin user successfully created.');
  }
}

  async getAll() {
    const data = await this.model.find().select('-password');

    return {
      success: true,
      data,
    };
  }

  async getOne(id: string) {
    const data = await this.model.findById(id).select('-password');

    if (!data) throw new NotFoundException('Пользователь не найден');

    return {
      success: true,
      data,
    };
  }

  async changeUserRole(changeRoleDto: ChangeRoleDto): Promise<User> {
    const { userId, role } = changeRoleDto;

    const updatedUser = await this.model
      .findByIdAndUpdate(userId, { role }, { new: true })
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(
        'Пользователь с этим идентификатором не найден',
      );
    }

    return updatedUser;
  }

  async updateProfile(id: string, image: Express.Multer.File) {
    const user = await this.model.findById(id);

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    fs.writeFile(
      path.join(
        UPLOAD_DIR,
        `${id.toString()}.${image.mimetype?.split('/').at(-1) as string}`,
      ),
      image.buffer,
    );

    return {
      success: true,
    };
  }

  private async hashPass(password: string) {
    return await bcrypt.hash(password, 10);
  }

  private async comparePass(originalPass: string, hashedPass: string) {
    return await bcrypt.compare(originalPass, hashedPass);
  }
}
