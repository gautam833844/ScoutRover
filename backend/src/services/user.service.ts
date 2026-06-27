import UserRepository from '../repositories/user.repository';
import ApiError from '../utils/apiError';
import auditService from './audit.service';

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User profile not found');
    }
    const userObj = user.toObject();
    delete userObj.password;
    return userObj;
  }

  async updateProfile(userId: string, updates: any) {
    // Prevent role alterations via profile update endpoint
    delete updates.role;
    delete updates.email;
    delete updates.password;

    const user = await this.userRepository.update(userId, updates);
    if (!user) {
      throw new ApiError(404, 'User profile not found');
    }

    await auditService.log({
      userId,
      action: 'USER_UPDATE_PROFILE',
      description: `User successfully updated profile fields: ${Object.keys(updates).join(', ')}`,
    });

    const userObj = user.toObject();
    delete userObj.password;
    return userObj;
  }

  async changePassword(userId: string, currentPass: string, newPass: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const isMatch = await user.comparePassword(currentPass);
    if (!isMatch) {
      throw new ApiError(400, 'Current password is incorrect');
    }

    user.password = newPass;
    await user.save();

    await auditService.log({
      userId,
      action: 'USER_PASSWORD_CHANGE',
      description: 'User successfully updated account password',
    });
  }

  async listUsers(options: any) {
    const searchFields = ['email', 'firstName', 'lastName'];
    const result = await this.userRepository.findWithPagination({
      ...options,
      searchFields,
    });

    const docs = result.docs.map((doc) => {
      const obj = doc.toObject();
      delete obj.password;
      return obj;
    });

    return { ...result, docs };
  }

  async getUserById(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    const userObj = user.toObject();
    delete userObj.password;
    return userObj;
  }

  async updateUser(id: string, updates: any, actorId: string) {
    // Only allow updating roles and status via administrative updates
    const allowedUpdates: any = {};
    if (updates.role) allowedUpdates.role = updates.role;
    if (updates.firstName) allowedUpdates.firstName = updates.firstName;
    if (updates.lastName) allowedUpdates.lastName = updates.lastName;

    const user = await this.userRepository.update(id, allowedUpdates);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    await auditService.log({
      userId: actorId,
      action: 'USER_ADMIN_UPDATE',
      description: `Admin updated user configuration for ID: ${id}`,
    });

    const userObj = user.toObject();
    delete userObj.password;
    return userObj;
  }

  async deleteUser(id: string, actorId: string) {
    if (id === actorId) {
      throw new ApiError(400, 'You cannot delete your own admin account');
    }

    const user = await this.userRepository.delete(id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    await auditService.log({
      userId: actorId,
      action: 'USER_ADMIN_DELETE',
      description: `Admin deleted user profile: ${user.email} (ID: ${id})`,
    });

    return user;
  }
}

export const userService = new UserService();
export default userService;
