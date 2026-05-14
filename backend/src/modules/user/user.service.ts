import { prisma } from '../../config/prisma';
import { NotFoundError } from '../../utils/errors';

export class UserService {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        role: true,
        plan: true,
        state: true,
        zip_code: true,
        created_at: true,
        updated_at: true,
        last_active_at: true,
        status: true,
        family_profile: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    return user;
  }

  async updateProfile(
    userId: string,
    data: any
  ) {
    const { 
      full_name, phone, state, zip_code,
      household_size, num_children, children_ages, monthly_income,
      employment_status, housing_status, has_disability, is_pregnant
    } = data;

    // Update User basic info
    const userUpdate: any = {};
    if (full_name !== undefined) userUpdate.full_name = full_name;
    if (phone !== undefined) userUpdate.phone = phone;
    if (state !== undefined) userUpdate.state = state;
    if (zip_code !== undefined) userUpdate.zip_code = zip_code;

    const user = await prisma.user.update({
      where: { id: userId },
      data: userUpdate,
      include: { family_profile: true }
    });

    // Update Family Profile if any family fields are present
    const hasFamilyData = [
      household_size, num_children, monthly_income, 
      employment_status, housing_status, has_disability, is_pregnant
    ].some(val => val !== undefined);

    if (hasFamilyData) {
      await prisma.familyProfile.upsert({
        where: { user_id: userId },
        create: {
          user_id: userId,
          household_size: household_size || 1,
          num_children: num_children || 0,
          children_ages: children_ages || [],
          monthly_income: monthly_income || 0,
          employment_status: employment_status || 'unemployed',
          housing_status: housing_status || 'renting',
          has_disability: has_disability || false,
          is_pregnant: is_pregnant || false,
        },
        update: {
          ...(household_size !== undefined && { household_size }),
          ...(num_children !== undefined && { num_children }),
          ...(children_ages !== undefined && { children_ages }),
          ...(monthly_income !== undefined && { monthly_income }),
          ...(employment_status !== undefined && { employment_status }),
          ...(housing_status !== undefined && { housing_status }),
          ...(has_disability !== undefined && { has_disability }),
          ...(is_pregnant !== undefined && { is_pregnant }),
        }
      });
    }

    return this.getProfile(userId);
  }

  async getFamilyProfile(userId: string) {
    const profile = await prisma.familyProfile.findUnique({
      where: { user_id: userId },
    });

    if (!profile) {
      throw new NotFoundError('Family profile not configured yet');
    }

    return profile;
  }

  async updateFamilyProfile(
    userId: string,
    data: {
      household_size: number;
      num_children: number;
      children_ages: number[];
      monthly_income: number;
      employment_status: string;
      housing_status: string;
      has_disability: boolean;
      is_pregnant: boolean;
    }
  ) {
    return prisma.familyProfile.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        ...data,
      },
      update: data,
    });
  }
}
