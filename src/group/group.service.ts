/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { groupModule, GroupCreatedBy } from './group.schema';
import mongoose, { Model, Types } from 'mongoose';
import { authModule } from 'src/users/users.schema';
import { S3UploadService } from 'utils/s3Uploader';
import {
  createGroupDto,
  getGroupPriceDto,
  respondToGroupInviteDto,
  updateGroupDto,
  updateGroupPriceDto,
  updateStatusOfTestDto,
} from './group.dto';
import { PopulatedGroups } from 'utils/helper';
import { testModule } from 'src/test/test.schema';
import { createTestDto } from 'src/test/test.dto';
import { notificationModule } from 'src/notification/notification.schema';
import { sectionModule } from 'src/section/section.schema';
import { userTestAttemptModule } from 'src/user-test-attempt/user-test-attempt.schema';
import { pricingPlansModule } from 'src/pricing/pricing.schema';
import { userSubscriptionModule } from 'src/user-subscription/user-subscription.schema';

interface MemberUser {
  _id: string;
  profilePicture?: string;
}

interface PopulatedMember {
  user: MemberUser;
  role: 'group-admin' | 'group-manager' | 'member';
}

interface PopulatedGroup {
  _id: string;
  title: string;
  description: string;
  logo?: string;
  admin: string;
  members: PopulatedMember[];
  createdBy: string;
  joinRequests: mongoose.Types.ObjectId[];
}

interface GroupAdmin {
  name: string;
  phone: string;
  image?: string | null;
}

interface GroupSummary {
  _id: any;
  title: string;
  logo?: string | null;
  group_type?: string | null;
  membersCount: number;
  admin: GroupAdmin;
}

@Injectable()
export class GroupService {
  constructor(
    @InjectModel(groupModule.name) private groupModule: Model<groupModule>,
    @InjectModel(authModule.name) private authModule: Model<authModule>,
    @InjectModel(testModule.name) private testModule: Model<testModule>,
    @InjectModel(userTestAttemptModule.name)
    private userTestAttemptModule: Model<userTestAttemptModule>,
    @InjectModel(notificationModule.name)
    private notificationModule: Model<notificationModule>,
    @InjectModel(sectionModule.name)
    private sectionModule: Model<sectionModule>,
    @InjectModel(pricingPlansModule.name)
    private pricingModule: Model<pricingPlansModule>,
    @InjectModel(userSubscriptionModule.name)
    private userSubscriptionModule: Model<userSubscriptionModule>,
    private s3Service: S3UploadService,
  ) {}

  async createGroup(
    groupDto: createGroupDto,
    userId: string,
    file?: Express.Multer.File,
  ) {
    if (groupDto.invitedPhoneNumbers.length < 5) {
      throw new ForbiddenException('At least 5 users must be invited');
    }

    if (groupDto.invitedPhoneNumbers.includes(userId)) {
      throw new BadRequestException('You cannot invite yourself to the group.');
    }

    const findGroups = await this.groupModule.findOne({
      title: groupDto.title,
    });

    if (findGroups) {
      throw new BadRequestException('group with same name already exists.');
    }

    const user = await this.authModule.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found, please sign up.');
    }

    const invitedUsers = await this.authModule.find({
      phoneNumber: { $in: groupDto.invitedPhoneNumbers },
    });

    if (invitedUsers.length < groupDto.invitedPhoneNumbers.length) {
      throw new NotFoundException('One or more invited users not found');
    }

    const selfInvited = invitedUsers.some(
      (invitedUser) => invitedUser.phoneNumber === user.phoneNumber,
    );

    if (selfInvited) {
      throw new BadRequestException('You cannot invite yourself to the group.');
    }

    const invitedUserIds = invitedUsers.map((u) => u._id);

    // Normalize and validate createdBy (accepts case-insensitive inputs)
    const createdByUpper = String(groupDto.createdBy || '')
      .trim()
      .toUpperCase();
    if (!Object.values(GroupCreatedBy).includes(createdByUpper as GroupCreatedBy)) {
      throw new BadRequestException(
        'createdBy must be either TEACHER or STUDENT',
      );
    }

    if (file) {
      const uploadedUrl = await this.s3Service.uploadFile(file, 'logo');
      groupDto.logo = uploadedUrl;
    }

    const groupPricing = await this.pricingModule.findOne({ type: 'group' });

    if (!groupPricing || !groupPricing.plans?.length) {
      throw new NotFoundException('No pricing plan found for groups.');
    }

    const group = await this.groupModule.create({
      title: groupDto.title,
      description: groupDto.description,
      logo: groupDto.logo,
      admin: userId,
      invitedUsers: invitedUserIds,
      members: [
        {
          user: userId,
          role: 'group-admin',
        },
      ],
      createdBy: createdByUpper as GroupCreatedBy,
      pricePerStudent: groupPricing.plans,
      whatsappLink: groupDto.whatsappLink,
      youtubeLink: groupDto.youtubeLink,
    });

    user.myGroups?.push(group._id);

    await user.save();

    await this.authModule.updateMany(
      { _id: { $in: invitedUserIds } },
      { $addToSet: { invitedGroups: group._id } },
    );

    await Promise.all(
      invitedUsers.map((invitedUser) =>
        this.notificationModule.create({
          userId: invitedUser._id,
          message: `📩 ${user.Name || 'A member'} has invited you to be part of the group "${group.title}". Tap to learn more and respond to the invitation.`,
          groupId: group._id,
          image: group.logo,
          invitationStatus: 'pending',
          type: 'Group Invitation',
        }),
      ),
    );

    return {
      message: 'Group created successfully',
      data: group,
      success: true,
    };
  }

  async requestToJoinGroup(groupId: string, userId: string) {
    const group = await this.groupModule.findById(groupId);

    if (!group) {
      throw new NotFoundException('group not found, please enter correct ID.');
    }

    const user = await this.authModule.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found, please sign up.');
    }

    const isAlreadyMember = group.members.some(
      (member) => member.user && member.user.toString() === userId,
    );

    if (isAlreadyMember) {
      throw new ForbiddenException('Already a member of this group.');
    }

    if (group.joinRequests.includes(user._id)) {
      throw new ForbiddenException('Already requested!');
    }

    group.joinRequests.push(user._id);
    await group.save();

    user.requestedToJoinGroups?.push(group._id);
    await user.save();

    await this.notificationModule.create({
      userId: group.admin,
      message: `📥 ${user.Name} has requested to join your group "${group.title}". Please review the request to approve or decline.`,
      groupId: group._id,
      image: group.logo,
      type: 'Group Join Request',
      invitationStatus: 'pending',
      requestedUserId: user._id,
    });

    return {
      message: 'Join request sent successfully',
      success: true,
    };
  }

  async approveMember(groupId: string, adminId: string, userId: string) {
    const group = await this.groupModule.findById(groupId);

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const user = await this.authModule.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found, please signup.');
    }

    if (String(group.admin) !== adminId) {
      throw new ForbiddenException('Only admin can approve');
    }

    const isAlreadyMember = group.members.some(
      (member) => member.user.toString() === userId,
    );

    if (isAlreadyMember) {
      throw new BadRequestException('User is already a member of the group.');
    }

    // group.members.push({
    //   user: user._id,
    //   role: 'member',
    // });

    await this.groupModule.findByIdAndUpdate(
      groupId,
      {
        $addToSet: { members: { user: user._id, role: 'member' } },
      },
      { new: true },
    );

    group.joinRequests = group.joinRequests.filter(
      (id) => id.toString() !== userId,
    );

    await group.save();
    await user.save();

    await this.notificationModule.create({
      userId: user._id,
      message: `✅ Congratulations! Your request to join "${group.title}" has been approved.`,
      groupId: group._id,
      image: group.logo,
      type: 'Group Join Approval',
      status: 'approved',
    });

    return {
      message: 'user approved successfully',
      success: true,
    };
  }

  async removeMember(groupId: string, adminId: string, userId: string) {
    const group = await this.groupModule.findById(groupId);

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (String(group.admin) !== adminId) {
      throw new ForbiddenException('Only admin can remove');
    }

    group.members = group.members.filter(
      (member) => member.user.toString() !== userId,
    );

    await group.save();

    await this.notificationModule.create({
      userId: userId,
      message: `⚠️ You have been removed from the group "${group.title}".`,
      image: group.logo,
      groupId: group._id,
      type: 'Group Removal',
      status: 'removed',
    });

    return {
      message: 'User removed successfully',
      success: true,
    };
  }

  async deleteGroup(groupId: string, adminId: string) {
    const group = await this.groupModule.findById(groupId);

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (String(group.admin) !== adminId) {
      throw new ForbiddenException('Only admin can delete');
    }

    const allUserIds = [
      ...group.members.map((m) => m.user.toString()),
      ...group.invitedUsers.map((id) => id.toString()),
      ...group.joinRequests.map((id) => id.toString()),
    ];

    const memberIds = group.members.map((m) => m.user);
    await this.authModule.updateMany(
      { _id: { $in: memberIds } },
      { $pull: { myGroups: group._id } },
    );

    await this.authModule.updateMany(
      { _id: { $in: group.invitedUsers } },
      { $pull: { invitedGroups: group._id } },
    );

    await this.authModule.updateMany(
      { _id: { $in: group.joinRequests } },
      { $pull: { requestedToJoinGroups: group._id } },
    );

    await this.notificationModule.deleteMany({ groupId: group._id });

    await Promise.all(
      allUserIds.map((userId) =>
        this.notificationModule.create({
          userId,
          message: `⚠️ The group "${group.title}" was deleted by the group administrator.`,
          image: group.logo,
          groupId: group._id,
          type: 'Group Deletion',
        }),
      ),
    );

    await this.groupModule.findByIdAndDelete(groupId);

    return {
      message: 'Group deleted successfully',
      success: true,
    };
  }

  async getMembersIfAuthorized(groupId: string) {
    const group = await this.groupModule
      .findById(groupId)
      .populate({
        path: 'members.user',
        select: 'Name phoneNumber profilePicture',
      })
      .exec();

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const members = group.members.map((member: any) => ({
      _id: member.user._id,
      name: member.user.Name,
      phoneNumber: member.user.phoneNumber,
      profilePicture: member.user.profilePicture,
      role: member.role,
      joinedAt: member.joinedAt,
    }));

    return {
      message: 'Group members fetched successfully',
      data: members,
      success: true,
    };
  }

  async fetchAllGroupsWithType(userId: string | null) {
    const pipeline: any[] = [];

    // 1. Match Stage: Filter groups based on userId if provided
    if (userId) {
      const userObjectId = new mongoose.Types.ObjectId(userId);
      pipeline.push({
        $match: {
          admin: { $ne: userObjectId },
          'members.user': { $ne: userObjectId },
        },
      });
    }

    // 2. Lookup Stage: Find the latest test for each group
    pipeline.push({
      $lookup: {
        from: 'testmodules', // Collection name for testModule
        let: { groupId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  // Case 1: group is an array and contains groupId
                  {
                    $and: [
                      { $isArray: '$group' },
                      { $in: ['$$groupId', '$group'] },
                    ],
                  },
                  // Case 2: group is a single value (ObjectId) and equals groupId
                  { $eq: ['$group', '$$groupId'] },
                ],
              },
            },
          },
          { $sort: { createdAt: -1 } },
          { $limit: 1 },
          { $project: { createdAt: 1 } },
        ],
        as: 'latestTest',
      },
    });

    // 3. Add Fields Stage: Extract latestTestDate
    pipeline.push({
      $addFields: {
        latestTestDate: {
          $ifNull: [
            { $arrayElemAt: ['$latestTest.createdAt', 0] },
            new Date(0),
          ],
        },
      },
    });

    // 4. Sort Stage: Sort by latestTestDate descending
    pipeline.push({
      $sort: { latestTestDate: -1 },
    });

    // 5. Project Stage: Select necessary fields
    pipeline.push({
      $project: {
        title: 1,
        description: 1,
        logo: 1,
        members: 1,
        admin: 1,
        createdBy: 1,
        joinRequests: 1,
        latestTestDate: 1,
      },
    });

    // Execute Aggregation
    const groups = await this.groupModule.aggregate(pipeline).exec();

    // Populate members.user manually
    await this.groupModule.populate(groups, {
      path: 'members.user',
      select: '_id profilePicture',
    });

    // Map response
    const response = groups.map((group) => {
      const isRequested =
        userId &&
        group.joinRequests?.some(
          (requestId: any) => requestId.toString() === userId,
        );

      const status: 'pending' | 'none' = isRequested ? 'pending' : 'none';

      return {
        id: group._id,
        title: group.title,
        description: group.description,
        logo: group.logo,
        totalMembers: group.members?.length || 0,
        createdBy: group.createdBy || '',
        status: userId ? status : 'none',
        members:
          group.members
            ?.filter((m: any) => m.user)
            .map((m: any) => ({
              _id: m.user._id,
              profilePicture: m.user.profilePicture || null,
            })) || [],
      };
    });

    return {
      message: 'Groups fetched successfully',
      success: true,
      data: response,
    };
  }

  async assignGroupManager(
    groupId: string,
    userId: string,
    requestingUserId: string,
  ) {
    const group = await this.groupModule.findById(groupId);

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.admin.toString() !== requestingUserId.toString()) {
      throw new ForbiddenException('Only group admin can assign a manager');
    }

    const user = await this.authModule.findById(userId);
    if (!user) {
      throw new NotFoundException('User to assign as manager not found');
    }

    const member = group.members.find(
      (m) => m.user.toString() === userId.toString(),
    );

    if (!member) {
      throw new BadRequestException('User must be a group member first');
    }

    member.role = 'group-manager';
    await group.save();

    await this.notificationModule.create({
      userId: user._id,
      message: `🎉 You have been assigned as a manager of the group "${group.title}".`,
      groupId: group._id,
      image: group.logo,
      type: 'Role Change',
    });

    await Promise.all(
      group.members
        .filter((m) => m.user.toString() !== userId.toString())
        .map((m) =>
          this.notificationModule.create({
            userId: m.user,
            message: `📢 ${user.Name} is now a manager of the group "${group.title}".`,
            groupId: group._id,
            image: group.logo,
            type: 'Role Change',
          }),
        ),
    );

    return {
      message: 'Group manager assigned successfully',
      groupId,
      managerId: userId,
    };
  }

  async demoteGroupManager(
    groupId: string,
    userId: string,
    requestingUserId: string,
  ) {
    const group = await this.groupModule
      .findById(groupId)
      .populate('members.user', 'Name')
      .exec();

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.admin.toString() !== requestingUserId.toString()) {
      throw new ForbiddenException('Only group admin can demote a manager');
    }

    const member = group.members.find(
      (m) =>
        (m.user?._id?.toString?.() || m.user?.toString?.()) ===
        userId.toString(),
    );

    if (!member) {
      throw new NotFoundException('User is not a group member');
    }

    const user = await this.authModule.findById(userId);
    if (!user) {
      throw new NotFoundException('User to assign as manager not found');
    }

    if (member.role !== 'group-manager') {
      throw new BadRequestException('User is not a manager');
    }

    member.role = 'member';
    await group.save();

    await this.notificationModule.create({
      userId: userId,
      message: `⚠ You have been demoted from manager to member in the group "${group.title}".`,
      groupId: group._id,
      image: group.logo,
      type: 'Role Change',
    });

    await Promise.all(
      group.members
        .filter((m) => m.user.toString() !== userId.toString())
        .map((m) =>
          this.notificationModule.create({
            userId: m.user,
            message: `📢 ${user?.Name || 'A member'} has been demoted from manager in the group "${group.title}".`,
            groupId: group._id,
            image: group.logo,
            type: 'Role Change',
          }),
        ),
    );

    return {
      message: 'Group manager demoted to member successfully',
      groupId,
      memberId: userId,
    };
  }

  async getUserJoinedGroups(userId: string) {
    const groups = await this.groupModule
      .find({
        'members.user': userId,
        admin: { $ne: userId },
      })
      .populate('admin');

    return {
      message: 'Joined groups fetched successfully',
      data: groups,
      success: true,
    };
  }

  async createGroupTest(
    groupId: string,
    userId: string,
    testDto: createTestDto,
  ): Promise<any> {
    const group = await this.groupModule.findById(groupId);

    if (!group) throw new NotFoundException('Group not found');

    const isAuthorized = group.members.some(
      (member) =>
        member.user.toString() === userId &&
        ['group-admin', 'group-manager'].includes(member.role),
    );

    if (!isAuthorized) {
      throw new ForbiddenException(
        'Only group admin or manager can create test',
      );
    }

    const sections: { id: mongoose.Types.ObjectId; questions: string[] }[] = await Promise.all(
      testDto.sections.map(async (section) => {
        const createdSection = await this.sectionModule.create({
          user: userId,
          name: section.name,
          name_hi: section.name_hi,
          order: section.order,
          timeLimit: section.timeLimit,
          questions: section.questionIds,
        });
        return { id: createdSection._id, questions: section.questionIds };
      }),
    );

    const durationInSeconds = testDto.durationInMinutes * 60;

    const test = await this.testModule.create({
      ...testDto,
      sections: sections.map((s) => s.id),
      totalQuestions: sections.reduce(
        (acc, curr) => acc + curr.questions.length,
        0,
      ),
      user: userId,
      group: group._id,
      durationInMinutes: durationInSeconds,
    });

    const membersToNotify = group.members.filter(
      (m) => m.user && m.user.toString() !== userId,
    );

    for (const member of membersToNotify) {
      await this.notificationModule.create({
        userId: member.user._id,
        type: 'New Group Test',
        message: `📘 A new test *"${test.title}"* has been created in 👥 "${group.title}". Get ready to participate! 🚀`,
        image: group.logo,
        groupId: group._id,
        sent: true,
      });
    }

    return {
      message: 'Group test created successfully',
      test,
      success: true,
    };
  }

  async getTestsForGroup(groupId: string, userId: string) {
    const group = await this.groupModule.findById(groupId);
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const isMember = group.members.some(
      (member) => member.user.toString() === userId,
    );

    if (!isMember) {
      throw new ForbiddenException('Only group members can view tests');
    }

    const tests = await this.testModule.find({
      group: groupId,
      status: 'published',
    });

    return {
      message: 'Tests fetched successfully',
      data: tests,
      success: true,
    };
  }

  async searchGroups(keyword: string) {
    const regex = new RegExp(keyword, 'i');
    const group = this.groupModule.find({
      $or: [{ title: regex }, { description: regex }],
    });

    return {
      message: 'Groups searched successfully',
      data: group,
      success: true,
    };
  }

  async getGroupsByAdmin(adminId: string) {
    const group = await this.groupModule
      .find({
        $or: [
          { admin: adminId },
          {
            members: {
              $elemMatch: {
                user: adminId,
                role: 'group-manager',
              },
            },
          },
        ],
      })
      .populate('admin', 'username email')
      .populate('members.user', 'username email')
      .populate('invitedUsers', 'username email')
      .populate('joinRequests', 'username email')
      .exec();

    return {
      message: 'All my groups fetched successfully',
      data: group,
      success: true,
    };
  }

  async fetchOneGroup(groupId: string, userId?: string | null) {
    const group = await this.groupModule
      .findById(groupId)
      .populate({
        path: 'members.user',
        select: '_id profilePicture',
      })
      .populate('admin')
      .lean();

    if (!group) {
      throw new NotFoundException('group not found');
    }

    let role: 'admin' | 'member' | 'none' = 'none';
    let isJoined = false;
    let groupInvitationStatus: string|null = null;
    if (userId) {
      if (group.admin?.toString() === userId) {
        role = 'admin';
        isJoined = true;
      } else if (
        group.members?.some((member) => member.user?._id?.toString() === userId)
      ) {
        role = 'member';
        isJoined = true;
      }
      groupInvitationStatus = isJoined ? 'joined' : group.joinRequests.some(request => request.toString() === userId) ? 'pending' : null;
    }
    return {
      message: 'Group fetched successfully',
      data: {
        ...group,
        currentUserRole: role,
        isJoined,
        groupInvitationStatus
      },
      success: true,
    };
  }

  async searchGroupsByName(search: string, userId: string) {
    const groups = await this.groupModule.aggregate([
      {
        $match: {
          title: { $regex: search, $options: 'i' },
          'members.user': { $ne: new mongoose.Types.ObjectId(userId) },
        },
      },
      {
        $project: {
          title: 1,
          logo: 1,
          description: 1,
          type: '$createdBy',
          numberOfMembers: { $size: '$members' },
        },
      },
    ]);

    return {
      success: true,
      message: 'Groups fetched successfully',
      data: groups,
    };
  }

  async editGroupTest(
    groupId: string,
    testId: string,
    userId: string,
    updateDto: Partial<createTestDto>,
  ): Promise<any> {
    const group = await this.groupModule.findById(groupId).lean();
    if (!group) throw new NotFoundException('Group not found');

    const isAuthorized = group.members.some(
      (member) =>
        member.user.toString() === userId &&
        ['group-admin', 'group-manager'].includes(member.role),
    );

    if (!isAuthorized) {
      throw new ForbiddenException(
        'Only group admin or manager can edit the test',
      );
    }

    let sections: { id: mongoose.Types.ObjectId; questions: string[] }[] = [];

    if (updateDto.sections && updateDto.sections.length > 0) {
      sections = await Promise.all(
        updateDto.sections.map(async (section) => {
          const sectionPayload = {
            user: userId,
            name: section.name,
            name_hi: section.name_hi,
            order: section.order,
            timeLimit: section.timeLimit,
            questions: (section.questionIds || []).map(
              (id) => new mongoose.Types.ObjectId(id),
            ),
          };

          if (section._id) {
            await this.sectionModule.findByIdAndUpdate(
              section._id,
              sectionPayload,
            );
            return { id: new mongoose.Types.ObjectId(section._id), questions: section.questionIds };
          } else {
            const newSection = await this.sectionModule.create(sectionPayload);
            return { id: new mongoose.Types.ObjectId(newSection._id), questions: section.questionIds };
          }
        }),
      );
    }

    const updatedPayload: any = {
      ...updateDto,
      sections: sections.map((s) => s.id.toString()),
      totalQuestions: sections.reduce(
        (acc, curr) => acc + curr.questions.length,
        0,
      ),
    };

    if (updateDto.durationInMinutes) {
      updatedPayload.durationInMinutes = updateDto.durationInMinutes * 60;
    }

    const test = await this.testModule.findOneAndUpdate(
      { _id: testId, group: groupId },
      updatedPayload,
      { new: true },
    );

    if (!test) {
      throw new NotFoundException('Test not found');
    }

    return {
      message: 'Group test updated successfully',
      data: test,
      success: true,
    };
  }

  async getAvailableTestsInGroup(groupId: string, userId?: string) {
    let submittedTestIds: mongoose.Types.ObjectId[] = [];
    let hasSubscription = false;

    if (userId) {
      const user = await this.authModule
        .findById(userId)
        .select('submittedTests');
      submittedTestIds = user?.submittedTests || [];

      const userSubscription = await this.userSubscriptionModule.findOne({
        user: userId,
        group: groupId,
      });

      if (userSubscription) {
        hasSubscription = true;
      }
    }

    return {
      message: 'Tests fetched successfully',
      data: await this.testModule
        .find({
          group: groupId,
          status: 'published',
          _id: { $nin: submittedTestIds },
          ...(userId && { user: { $ne: userId } }),
        })
        .lean(),
      hasSubscription,
      success: true,
    };
  }

  async getAttemptedTestsInGroup(groupId: string, userId: string) {
    const user = await this.authModule
      .findById(userId)
      .select('submittedTests');
    const submittedTestIds = user?.submittedTests || [];
    let hasSubscription = false;

    const userSubscription = await this.userSubscriptionModule.findOne({
      user: userId,
      group: groupId,
    });

    if (userSubscription) {
      hasSubscription = true;
    }

    if (submittedTestIds.length === 0) return [];

    return {
      message: 'Attempted tests inside group fetched successfully',
      data: await this.testModule
        .find({
          _id: { $in: submittedTestIds },
          group: groupId,
        })
        .lean(),
      hasSubscription,
      success: true,
    };
  }

  async leaveGroup(groupId: string, userId: string) {
    const group = await this.groupModule.findById(groupId);

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.admin.toString() === userId) {
      throw new BadRequestException("Admin can't leave the group");
    }

    const isMember = group.members.some((m) => m.user.toString() === userId);

    if (!isMember) {
      throw new BadRequestException('User is not a member of this group');
    }

    group.members = group.members.filter((m) => m.user.toString() !== userId);
    await group.save();

    await this.authModule.findByIdAndUpdate(userId, {
      $pull: { myGroups: group._id },
    });

    return {
      success: true,
      message: 'Left group successfully',
    };
  }

  async getGroupLeaderboard(groupId: string) {
    const tests = await this.testModule.find({ group: groupId }).select('_id');
    const testIds = tests.map((t) => t._id);

    const attempts = await this.userTestAttemptModule.find({
      testId: { $in: testIds },
    });

    const userMap = new Map();

    for (const attempt of attempts) {
      const userId = attempt.user.toString();

      const rawScore = attempt.score;
      const score =
        typeof rawScore === 'string'
          ? parseFloat(rawScore || '0')
          : typeof rawScore === 'number'
            ? rawScore
            : 0;

      if (!userMap.has(userId)) {
        userMap.set(userId, {
          userId,
          totalPoints: 0,
          totalAttempts: 0,
        });
      }

      const userData = userMap.get(userId);
      userData.totalPoints += score;
      userData.totalAttempts += 1;
    }

    const userIds = Array.from(userMap.keys());
    const users = await this.authModule.find({ _id: { $in: userIds } });

    const leaderboard = users.map((user) => {
      const entry = userMap.get(user._id.toString());
      return {
        userId: user._id,
        name: user.Name,
        profilePicture: user.profilePicture,
        totalPoints: entry.totalPoints,
        totalAttempts: entry.totalAttempts,
      };
    });

    leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);
    const rankedLeaderboard = leaderboard.map((user, index) => ({
      ...user,
      rank: index + 1,
    }));

    return {
      message: 'Leaderboard fetched successfully',
      data: rankedLeaderboard,
      success: true,
    };
  }

  async inviteUsersByPhone(
    groupId: string,
    currentUserId: string,
    phoneNumbers: string[],
  ): Promise<any> {
    const group = await this.groupModule.findById(groupId);
    if (!group) throw new NotFoundException('Group not found');

    if (!group.admin.equals(currentUserId)) {
      throw new ForbiddenException('Only admin can invite users');
    }

    const users = await this.authModule.find({
      phoneNumber: { $in: phoneNumbers },
    });

    if (!users.length) {
      throw new NotFoundException('No matching users found');
    }

    const userIdsToInvite = users.map((user) => user._id.toString());

    const alreadyInvited = group.invitedUsers.map((id) => id.toString());
    const memberIds = group.members.map((m) => m.user.toString());

    const alreadyInvitedUsers = userIdsToInvite.filter((id) =>
      alreadyInvited.includes(id),
    );
    if (alreadyInvitedUsers.length) {
      const invitedNumbers = users
        .filter((u) => alreadyInvitedUsers.includes(u._id.toString()))
        .map((u) => u.phoneNumber);

      throw new BadRequestException(
        `The following users are already invited: ${invitedNumbers.join(', ')}`,
      );
    }

    const alreadyMembers = userIdsToInvite.filter((id) =>
      memberIds.includes(id),
    );
    if (alreadyMembers.length) {
      const memberNumbers = users
        .filter((u) => alreadyMembers.includes(u._id.toString()))
        .map((u) => u.phoneNumber);

      throw new BadRequestException(
        `The following users are already members: ${memberNumbers.join(', ')}`,
      );
    }

    const newUserIds = userIdsToInvite.filter(
      (id) => !alreadyInvited.includes(id) && !memberIds.includes(id),
    );

    group.invitedUsers.push(...newUserIds.map((id) => new Types.ObjectId(id)));
    await group.save();

    const notifications = newUserIds.map((userId) => ({
      userId: new Types.ObjectId(userId),
      groupId: group._id,
      message: `📢 Invitation: You have been invited to join "${group.title}". Please accept or decline this invitation from your Groups section.`,
      invitationStatus: 'pending',
      type: 'Group Invitation',
    }));

    await this.notificationModule.insertMany(notifications);

    return {
      message: 'Users invited successfully',
      success: true,
    };
  }

  async fetchAllGroupsBySAdmin(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;

    const [groups, totalGroups] = await Promise.all([
      this.groupModule
        .find({title: { $regex: search || '', $options: 'i' } })
        .skip(skip)
        .limit(limit)
        .populate('admin', 'Name phoneNumber profilePicture')
        .populate('members.user', 'Name profilePicture')
        .lean(),

      this.groupModule.countDocuments({title: { $regex: search || '', $options: 'i' } }),
    ]);

    const formattedGroups: GroupSummary[] = groups.map((group: any) => ({
      _id: group._id,
      title: group.title,
      logo: group.logo || null,
      group_type: group.createdBy || null,
      membersCount: group.members?.length || 0,
      pricePerStudent: group.pricePerStudent,
      admin: {
        name: group.admin?.Name || '',
        phone: group.admin?.phoneNumber || '',
        image: group.admin?.profilePicture || null,
      },
    }));

    return {
      message: 'All groups fetched successfully',
      success: true,
      data: formattedGroups,
      meta: {
        total: totalGroups,
        page,
        limit,
        totalPages: Math.ceil(totalGroups / limit),
      },
    };
  }

  async getGroupDetails(groupId: string) {
    const group = await this.groupModule
      .findById(groupId)
      .populate('admin', 'Name profilePicture')
      .populate('members.user', 'Name profilePicture')
      .lean<PopulatedGroups>();

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const tests = await this.testModule
      .find({ group: group._id })
      .select(
        'title title_hi totalQuestions startDate endDate startTime endTime totalMarks durationInMinutes',
      )
      .exec();

    const members = group.members.map((member: any) => ({
      name: member.user?.Name || '',
      image: member.user?.profilePicture || null,
      role: member.role,
    }));

    return {
      message: 'Group detail fetched successfully',
      success: true,
      data: {
        _id: group._id,
        title: group.title,
        description: group.description,
        logo: group.logo || null,
        createdBy: group.createdBy,
        pricePerStudent: group.pricePerStudent,
        admin: {
          name: group.admin?.Name || '',
          image: group.admin?.profilePicture || null,
        },
        members,
        tests: tests.map((test) => ({
          name: test.title,
          name_hi: test.title_hi,
          totalQuestions: test.totalQuestions,
          startDate: test.startDate,
          endDate: test.endDate,
          startTime: test.startTime,
          endTime: test.endTime,
          totalMarks: test.totalMarks,
          duration: test.durationInMinutes,
        })),
      },
    };
  }

  async updateGroupPrice(groupId: string, priceDto: updateGroupPriceDto) {
    const group = await this.groupModule.findById(groupId);
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const updatedGroup = await this.groupModule.findByIdAndUpdate(
      groupId,
      { pricePerStudent: priceDto.pricePerStudent },
      { new: true },
    );

    return {
      message: 'Group price updated successfully',
      data: updatedGroup,
      success: true,
    };
  }

  async updateGroup(
    groupId: string,
    updateDto: updateGroupDto,
    userId: string,
    file?: Express.Multer.File,
  ) {
    const group = await this.groupModule.findById(groupId);

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.admin.toString() !== userId) {
      throw new ForbiddenException('Only the admin can update the group');
    }

    if (file) {
      const uploadedUrl = await this.s3Service.uploadFile(file, 'logo');
      group.logo = uploadedUrl;
    }

    if (updateDto.title) {
      group.title = updateDto.title;
    }

    if (updateDto.description) {
      group.description = updateDto.description;
    }

    if (updateDto.whatsappLink) {
      group.whatsappLink = updateDto.whatsappLink;
    }

    if (updateDto.youtubeLink) {
      group.youtubeLink = updateDto.youtubeLink;
    }

    await group.save();

    return {
      message: 'Group updated successfully',
      success: true,
      data: group,
    };
  }

  async getPriceByDuration(dto: getGroupPriceDto) {
    const { groupIds, duration } = dto;

    const categories = await this.groupModule.find({
      _id: { $in: groupIds },
    });

    if (!categories || categories.length === 0) {
      throw new NotFoundException(
        `No groups found for the given IDs: ${groupIds.join(', ')}`,
      );
    }

    const results = categories.map((cat) => {
      const plan = cat.pricePerStudent.find((p) => p.duration === duration);

      return {
        groupId: cat._id,
        groupName: cat.title,
        duration,
        price: plan ? plan.price : null,
      };
    });

    return {
      message: 'Subscription plans fetched successfully',
      data: results,
      success: true,
    };
  }

  async updateAllGroupsPrice(priceDto: updateGroupPriceDto) {
    const updatedResult = await this.groupModule.updateMany(
      {},
      { pricePerStudent: priceDto.pricePerStudent },
    );

    return {
      message: 'Price updated successfully for all groups',
      modifiedCount: updatedResult.modifiedCount,
      success: true,
    };
  }

  async respondToGroupInvite(
    respondToGroupInviteDto: respondToGroupInviteDto,
    userId: string,
  ) {
    const { notificationId, action } = respondToGroupInviteDto;

    const notification = await this.notificationModule.findById(notificationId);
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.invitationStatus !== 'pending') {
      throw new BadRequestException(
        'You have already responded to this invitation',
      );
    }

    const group = await this.groupModule.findById(notification.groupId);
    if (!group) throw new NotFoundException('Group not found');

    let targetUserId;

    if (notification.type === 'Group Join Request') {
      if (userId.toString() !== group.admin.toString()) {
        throw new ForbiddenException(
          'Only group admin can respond to join requests',
        );
      }
      targetUserId = notification.requestedUserId?.toString();
    } else if (notification.type === 'Group Invitation') {
      targetUserId = userId.toString();
    }

    const isAlreadyMember = group.members?.some(
      (m) => m.user.toString() === targetUserId,
    );

    if (action === 'accept') {
      if (!isAlreadyMember) {
        await this.groupModule.findByIdAndUpdate(notification.groupId, {
          $addToSet: { members: { user: targetUserId, role: 'member' } },
          $pull: { invitedUsers: targetUserId, joinRequests: targetUserId },
        });

        const user = await this.authModule.findByIdAndUpdate(targetUserId, {
          $addToSet: { myGroups: notification.groupId },
          $pull: {
            invitedGroups: notification.groupId,
            requestedToJoinGroups: notification.groupId,
          },
        });

        await this.notificationModule.create({
          userId: group.admin,
          type:
            notification.type === 'Group Join Request'
              ? 'Request Accepted'
              : 'Invitation Accepted',
          message: `✅ ${user?.Name} has joined the group "${group?.title}".`,
          groupId: group?._id,
          image: group?.logo,
        });
      } else {
        throw new BadRequestException('User is already a member of the group.');
      }
    }

    if (action === 'reject') {
      const user = await this.authModule.findByIdAndUpdate(targetUserId, {
        $pull: {
          invitedGroups: notification.groupId,
          requestedToJoinGroups: notification.groupId,
        },
      });

      await this.groupModule.findByIdAndUpdate(notification.groupId, {
        $pull: { invitedUsers: targetUserId, joinRequests: targetUserId },
      });

      await this.notificationModule.create({
        userId: group.admin,
        type:
          notification.type === 'Group Join Request'
            ? 'Request Rejected'
            : 'Invitation Rejected',
        message: `🚫 ${user?.Name} has declined your ${
          notification.type === 'Group Join Request' ? 'request' : 'invitation'
        } to join "${group?.title || 'group'}".`,
        groupId: group?._id,
        image: group?.logo,
      });
    }

    notification.invitationStatus =
      action === 'accept' ? 'accepted' : 'rejected';
    notification.isRead = true;
    await notification.save();

    return {
      message: `Invitation/Request ${action}ed successfully`,
      success: true,
    };
  }

  async updateGroupTestStatus(
    groupId: string,
    testId: string,
    userId: string,
    status: updateStatusOfTestDto,
  ): Promise<any> {
    const group = await this.groupModule.findById(groupId);
    if (!group) throw new NotFoundException('Group not found');

    const isAuthorized = group.members.some(
      (member) =>
        member.user.toString() === userId &&
        ['group-admin', 'group-manager'].includes(member.role),
    );

    if (!isAuthorized) {
      throw new ForbiddenException(
        'Only group admin or manager can update test status',
      );
    }

    const test = await this.testModule.findOne({
      _id: testId,
      group: groupId,
    });

    if (!test) {
      throw new NotFoundException('Test not found in this group');
    }

    test.status = status.status;
    await test.save();

    return {
      message: 'Test status updated successfully',
      test,
      success: true,
    };
  }

  async addTestToGroup(groupId: string, testId: string, adminId: string) {
    const group = await this.groupModule.findById(groupId);

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const isAdmin = group.members.some(
      (m) => m.user.toString() === adminId && m.role === 'group-admin',
    );

    if (!isAdmin) {
      throw new ForbiddenException('Only group admin can add tests');
    }

    const globalTest = await this.testModule.findById(testId);
    if (!globalTest) {
      throw new NotFoundException('Global test not found');
    }

    globalTest.group?.push(group._id);
    await globalTest.save();

    return {
      message: 'Test added to group successfully',
      data: globalTest,
    };
  }

  async searchMembers(groupId: string, phoneNumber?: string, name?: string) {
    const group = await this.groupModule.findById(groupId).lean();
    if (!group) throw new Error('Group not found');

    const memberIds = group.members
      .filter((m) => m && m.user)
      .map((m) => m.user);

    const query: any = { _id: { $in: memberIds } };

    if (phoneNumber) query.phoneNumber = { $regex: phoneNumber, $options: 'i' };
    if (name) query.Name = { $regex: name, $options: 'i' };

    const users = await this.authModule
      .find(query)
      .select('Name phoneNumber email profilePicture role')
      .limit(20)
      .lean()
      .exec();

    const subscriptions = await this.userSubscriptionModule
      .find({ user: { $in: users.map((u) => u._id) }, group: group._id })
      .select('duration startDate endDate status priceAtPurchase group user')
      .lean()
      .exec();

    const subscriptionMap = new Map<string, any>();
    subscriptions.forEach((sub) => {
      if (sub.user) subscriptionMap.set(sub.user.toString(), sub);
    });

    const roleMap = new Map<
      string,
      'group-admin' | 'group-manager' | 'member'
    >();
    group.members.forEach((m) => {
      if (m && m.user) roleMap.set(m.user.toString(), m.role || 'member');
    });

    const usersWithSubscriptionAndRole = users.map((u) => ({
      ...u,
      subscription: subscriptionMap.get(u._id.toString()) || null,
      groupRole: roleMap.get(u._id.toString()) || 'member',
    }));

    return {
      message: 'User fetched successfully',
      data: usersWithSubscriptionAndRole,
      success: true,
    };
  }

  async getTestsForGroupByAdminManager(userId: string, groupId: string) {
    const group = await this.groupModule.findById(groupId);
    if (!group) throw new NotFoundException('Group not found');

    const isMember =
      group.admin.toString() === userId ||
      group.members.some((m) => m.user.toString() === userId);

    if (!isMember) {
      throw new ForbiddenException('You are not a member of this group');
    }

    let role: string | null = null;

    if (group.admin.toString() === userId) {
      role = 'group-admin';
    } else {
      const member = group.members.find((m) => m.user.toString() === userId);
      if (member && member.role === 'group-manager') {
        role = 'group-manager';
      }
    }

    if (!role) {
      throw new ForbiddenException(
        'Only group admin or manager can view tests',
      );
    }

    const tests = await this.testModule
      .find({ group: groupId })
      .sort({ createdAt: -1 })
      .populate('user')
      .populate({
        path: 'sections',
        select: 'name name_hi order timeLimit questions',
      })
      .lean();

    const now = new Date();
    const filteredTests = tests.filter((test) => {
      if (test.type === 'mock') return true;

      if (test.type === 'live') {
        if (test.user._id.toString() === userId) return true;

        if (test.endDate && test.endDate < now) return true;

        return false;
      }

      return false;
    });

    const data = filteredTests.map((test) => {
      const sectionsWithQuestionIds = (test.sections || []).map((section: any) => ({
        sectionId: section._id,
        questionIds: (section.questions || []).map((q: any) =>
          typeof q === 'string' ? q : (q?._id ?? q)?.toString?.() ?? q,
        ),
        name: section.name,
        name_hi: section.name_hi,
        order: section.order,
        timeLimit: section.timeLimit,
      }));
      return {
        ...test,
        sections: sectionsWithQuestionIds,
      };
    });

    return {
      message: 'Tests fetched successfully',
      data,
      success: true,
    };
  }
}
