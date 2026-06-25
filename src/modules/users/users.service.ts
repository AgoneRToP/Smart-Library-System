import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './models/user.model';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@/common/enums/role.enum';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async onModuleInit() {
    const adminEmail = 'admin@library.com';
    
    const adminExists = await this.userModel.findOne({ email: adminEmail }).exec();
    
    if (!adminExists) {
      console.log('⚠️ Системный администратор не найден. Создаю учетную запись...');
      
      const hashedPassword = await bcrypt.hash('AdminPassword123', 10);
      
      await this.userModel.create({
        email: adminEmail,
        fullName: 'System Administrator',
        password: hashedPassword,
        role: UserRole.ADMIN,
        isActive: true,
      });
      
      console.log('✅ Администратор успешно восстановлен: admin@library.com / AdminPassword123');
    }
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findOne(id: string) {
    const data = await this.userModel.findById(id).select('-password');
    if (!data) throw new NotFoundException('User not found');
    return { success: true, data };
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Пользователь не найден');
  }

  async updateStatus(id: string, isActive: boolean): Promise<void> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { isActive }, { new: true })
      .exec();
    if (!user) throw new NotFoundException('Пользователь не найден');
  }
}
