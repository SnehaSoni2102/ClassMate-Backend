/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JwtPayload, RequestWithAuthHeaders } from 'src/types/auth.types';
import { GroupService } from './group.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  createGroupDto,
  getGroupPriceDto,
  inviteUserDto,
  leaveGroupDto,
  respondToGroupInviteDto,
  updateGroupDto,
  updateGroupPriceDto,
  updateStatusOfTestDto,
} from './group.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard, OptionalJwtAuthGuard } from 'guards/jwt.guards';
import { Roles, UserRole } from 'utils/helper';
import { createTestDto, updateTestDto } from 'src/test/test.dto';
import { JwtService } from '@nestjs/jwt';
import { updatePriceDto } from 'src/category/category.dto';

@ApiTags('GROUP')
@Controller('group')
export class GroupController {
  constructor(
    private groupService: GroupService,
    private jwtService: JwtService,
  ) {}

  @Post('create')
  @ApiOperation({ summary: 'Create Group' })
  @ApiResponse({ status: 201, description: 'Group created successfully' })
  @ApiResponse({ status: 403, description: 'At least 5 users must be invited' })
  @ApiResponse({ status: 404, description: 'User not found, please sign up.' })
  @ApiResponse({
    status: 400,
    description: 'Free coins already used, please take premium.',
  })
  @ApiResponse({
    status: 404,
    description: 'One or more invited users not found',
  })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('logo'))
  @ApiBody({ type: createGroupDto })
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.STUDENT)
  createGroup(
    @Request() req,
    @Body() createGroupDto: createGroupDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.groupService.createGroup(createGroupDto, req.user._id, file);
  }

  @Get('all')
  @ApiOperation({ summary: 'fetch all groups' })
  @ApiResponse({
    status: 200,
    description: 'groups fetched successfully',
  })
  @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  // @Roles(UserRole.ADMIN, UserRole.STUDENT, UserRole.SUPERADMIN)
  fetchAllGroups(@Request() req: RequestWithAuthHeaders) {
    let userId: string | undefined;

    const authHeader = req.headers['authorization'];
    const headerStr =
      typeof authHeader === 'string'
        ? authHeader
        : Array.isArray(authHeader)
          ? authHeader[0]
          : undefined;
    if (headerStr?.startsWith('Bearer ')) {
      const token = headerStr.split(' ')[1];
      try {
        const payload = this.jwtService.verify(token);
        userId = payload?.data?._id;
      } catch {
        userId = undefined;
      }
    }
    return this.groupService.fetchAllGroupsWithType(userId ?? null);
  }

  @Get('list-all')
  @ApiOperation({ summary: 'Fetch all groups (id and name only)' })
  @ApiResponse({
    status: 200,
    description: 'Groups list fetched successfully',
  })
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  fetchAllGroupsListAll(@Request() req: RequestWithAuthHeaders) {
    let userId: string | undefined;

    const authHeader = req.headers['authorization'];
    const headerStr =
      typeof authHeader === 'string'
        ? authHeader
        : Array.isArray(authHeader)
          ? authHeader[0]
          : undefined;
    if (headerStr?.startsWith('Bearer ')) {
      const token = headerStr.split(' ')[1];
      try {
        const payload = this.jwtService.verify(token);
        userId = payload?.data?._id;
      } catch {
        userId = undefined;
      }
    }
    return this.groupService.fetchAllGroupsListAll(userId ?? null);
  }

  @Get('/search-groups')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'search', required: true, type: String })
  @ApiOperation({ summary: 'Search groups by name (excluding joined groups)' })
  async searchGroups(@Request() req, @Query('search') search: string) {
    const userId = req.user._id;
    return this.groupService.searchGroupsByName(search, userId);
  }

  @Post('join-request/:id')
  @ApiOperation({ summary: 'Request to join group' })
  @ApiResponse({ status: 201, description: 'Request to join group successful' })
  @ApiResponse({
    status: 403,
    description: 'group not found, please enter correct ID.',
  })
  @ApiResponse({ status: 404, description: 'User not found, please sign up.' })
  @ApiResponse({
    status: 403,
    description: 'Already a members of this group.',
  })
  @ApiResponse({
    status: 403,
    description: 'Already requested!',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.STUDENT)
  joinRequest(@Param('id') groupId: string, @Request() req) {
    return this.groupService.requestToJoinGroup(groupId, req.user._id);
  }

  @Post('approve/:id/:userId')
  @ApiOperation({ summary: 'Approve member request' })
  @ApiResponse({
    status: 201,
    description: 'Memeber request accepted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'group not found, please enter correct ID.',
  })
  @ApiResponse({ status: 404, description: 'User not found, please sign up.' })
  @ApiResponse({
    status: 400,
    description: 'Free coins already used, please take premium.',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.STUDENT)
  approveRequest(
    @Param('id') groupId: string,
    @Param('userId') userId: string,
    @Request() req,
  ) {
    return this.groupService.approveMember(groupId, req.user._id, userId);
  }

  @Post('remove/:id/:userId')
  @ApiOperation({ summary: 'remove member from group' })
  @ApiResponse({
    status: 201,
    description: 'Member removed successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'group not found, please enter correct ID.',
  })
  @ApiResponse({ status: 404, description: 'User not found, please sign up.' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.STUDENT)
  removeMember(
    @Param('id') groupId: string,
    @Param('userId') userId: string,
    @Request() req,
  ) {
    return this.groupService.removeMember(groupId, req.user._id, userId);
  }

  @Delete('delete/:id')
  @ApiOperation({ summary: 'delete group' })
  @ApiResponse({
    status: 201,
    description: 'Group deleted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'group not found, please enter correct ID.',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.STUDENT)
  deleteGroup(@Param('id') groupId: string, @Request() req) {
    return this.groupService.deleteGroup(groupId, req.user._id);
  }

  @Get('members/:groupId')
  @ApiOperation({ summary: 'fetch all members of group' })
  @ApiResponse({
    status: 200,
    description: 'members fetched successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'group not found, please enter correct ID.',
  })
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async getGroupMembers(@Param('groupId') groupId: string) {
    return this.groupService.getMembersIfAuthorized(groupId);
  }

  @Put('assign-manager/:groupId/:userId')
  @ApiOperation({ summary: 'promote member as manager' })
  @ApiResponse({
    status: 200,
    description: 'manager added successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'group not found, please enter correct ID.',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.STUDENT)
  assignManager(
    @Request() req,
    @Param('groupId') groupId: string,
    @Param('userId') userId: string,
  ) {
    return this.groupService.assignGroupManager(groupId, userId, req.user._id);
  }

  @Put('demote-manager/:groupId/:userId')
  @ApiOperation({ summary: 'demote manager as member' })
  @ApiResponse({
    status: 200,
    description: 'manager demote successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'group not found, please enter correct ID.',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.STUDENT)
  demoteManager(
    @Request() req,
    @Param('groupId') groupId: string,
    @Param('userId') userId: string,
  ) {
    return this.groupService.demoteGroupManager(groupId, userId, req.user._id);
  }

  @Get('my-groups')
  @ApiOperation({ summary: 'fecth my joined groups' })
  @ApiResponse({
    status: 200,
    description: 'my groups fetched successfully',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.STUDENT)
  fetchMyGroups(@Request() req) {
    return this.groupService.getUserJoinedGroups(req.user._id);
  }

  @Get('your-groups')
  @ApiOperation({ summary: 'fecth my created groups' })
  @ApiResponse({
    status: 200,
    description: 'my groups fetched successfully',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.STUDENT)
  fetchMyCreatedGroups(@Request() req) {
    return this.groupService.getGroupsByAdmin(req.user._id);
  }

  @Post('create-test/:groupId')
  @ApiOperation({ summary: 'create test inside group' })
  @ApiResponse({
    status: 200,
    description: 'test created inside group successfully',
    type: createTestDto,
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.STUDENT)
  createTestInsideGroup(
    @Request() req,
    @Param('groupId') groupId: string,
    @Body() testDto: createTestDto,
  ) {
    return this.groupService.createGroupTest(groupId, req.user._id, testDto);
  }

  @Get('fetch-test/:groupId')
  @ApiOperation({ summary: 'fetch test inside group' })
  @ApiResponse({
    status: 200,
    description: 'test fetched inside group successfully',
    type: createTestDto,
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.STUDENT)
  fetchTestInsideGroup(@Request() req, @Param('groupId') groupId: string) {
    return this.groupService.getTestsForGroup(groupId, req.user._id);
  }

  @Get('search')
  @ApiOperation({ summary: 'search groups' })
  @ApiResponse({
    status: 200,
    description: 'groups fetched successfully',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.STUDENT)
  searchGroup(@Query('keyword') keyword: string) {
    return this.groupService.searchGroups(keyword);
  }

  @Get('one/:groupId')
  @ApiOperation({ summary: 'fetch one group' })
  @ApiResponse({
    status: 200,
    description: 'group fetched successfully',
  })
  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.STUDENT, UserRole.SUPERADMIN)
  fetchOneGroup(@Param('groupId') groupId: string, @Request() req) {
    return this.groupService.fetchOneGroup(groupId, req?.user?._id || null);
  }

  @Patch(':groupId/edit-test/:testId')
  @ApiOperation({ summary: 'Edit a test inside group' })
  @ApiResponse({
    status: 200,
    description: 'Group test updated successfully',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.STUDENT)
  editTestInsideGroup(
    @Request() req,
    @Param('groupId') groupId: string,
    @Param('testId') testId: string,
    @Body() updateDto: updateTestDto,
  ) {
    return this.groupService.editGroupTest(
      groupId,
      testId,
      req.user._id,
      updateDto,
    );
  }

  @Get(':groupId/tests/available')
  @ApiOperation({ summary: 'Fetch all unattempted tests inside group' })
  @ApiResponse({
    status: 200,
    description: 'Group tests fetched successfully',
  })
  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.STUDENT)
  getAvailableTests(@Param('groupId') groupId: string, @Request() req) {
    return this.groupService.getAvailableTestsInGroup(
      groupId,
      req?.user?._id || null,
    );
  }

  @Get(':groupId/tests/attempted')
  @ApiOperation({ summary: 'Fetch all attempted tests inside group' })
  @ApiResponse({
    status: 200,
    description: 'Group tests fetched successfully',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.STUDENT)
  getAttemptedTestsInGroup(@Param('groupId') groupId: string, @Request() req) {
    return this.groupService.getAttemptedTestsInGroup(groupId, req.user._id);
  }

  @Post('leave-group/:groupId')
  @ApiOperation({ summary: 'leave group' })
  @ApiResponse({
    status: 200,
    description: 'Group left successfully',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.STUDENT)
  async leaveGroup(@Param('groupId') groupId: string, @Request() req) {
    return this.groupService.leaveGroup(groupId, req.user._id);
  }

  @Get('leaderboard/:groupId')
  @ApiOperation({ summary: 'fetch leaderboard of a group' })
  @ApiResponse({
    status: 200,
    description: 'Group leaderboard fetched successfully',
  })
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: 'Fetch group leaderboard' })
  async getLeaderboard(@Param('groupId') groupId: string) {
    return this.groupService.getGroupLeaderboard(groupId);
  }

  @Post(':groupId/invite-by-phone')
  @ApiOperation({ summary: 'invite users to group by group admin' })
  @ApiResponse({
    status: 200,
    description: 'Group invitation sent  successfully',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.STUDENT)
  async inviteByPhone(
    @Param('groupId') groupId: string,
    @Body() dto: inviteUserDto,
    @Request() req,
  ) {
    return this.groupService.inviteUsersByPhone(
      groupId,
      req.user._id,
      dto.invitedPhoneNumbers,
    );
  }

  @Get('fetch-all-groups')
  @ApiOperation({ summary: 'Fetch all groups for superadmin' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    example: 'Group Name',
  })
  @ApiResponse({ status: 200, description: 'All groups fetched successfully' })
  @ApiBearerAuth()
  @Roles(UserRole.SUPERADMIN)
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async fetchAllGroupsBySuperAdmin(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
  ): Promise<any> {
    return this.groupService.fetchAllGroupsBySAdmin(+page, +limit, search);
  }

  @Get(':groupId/details')
  @ApiOperation({
    summary: 'Get group details with members and tests by super admin',
  })
  @ApiParam({ name: 'groupId', required: true, description: 'Group ID' })
  @ApiBearerAuth()
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async getGroupDetails(@Param('groupId') groupId: string) {
    return this.groupService.getGroupDetails(groupId);
  }

  @Patch(':groupId/update-price')
  @ApiOperation({ summary: 'Update group price' })
  @ApiResponse({
    status: 200,
    description: 'Group price updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Group not found, please enter correct ID',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.SUPERADMIN)
  async updateGroupPrice(
    @Param('groupId') groupId: string,
    @Body() priceUpdateDto: updateGroupPriceDto,
  ) {
    return this.groupService.updateGroupPrice(groupId, priceUpdateDto);
  }

  @Put(':groupId/update')
  @ApiOperation({ summary: 'Update group details' })
  @ApiResponse({
    status: 200,
    description: 'Group updated successfully',
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: updateGroupDto })
  @ApiResponse({
    status: 404,
    description: 'Group not found, please enter correct ID',
  })
  @Roles(UserRole.ADMIN, UserRole.STUDENT, UserRole.SUPERADMIN)
  @UseInterceptors(FileInterceptor('logo'))
  updateGroup(
    @Param('groupId') groupId: string,
    @Body() updateDto: updateGroupDto,
    @Request() req,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.groupService.updateGroup(
      groupId,
      updateDto,
      req.user._id,
      file,
    );
  }

  @Post('get-prices')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STUDENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fetch subscription plans for groups' })
  @ApiResponse({
    status: 200,
    description: 'group prices fetched successfully',
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async getPrices(@Body() dto: getGroupPriceDto) {
    return this.groupService.getPriceByDuration(dto);
  }

  @Patch('update-price/all')
  @ApiOperation({ summary: 'Update all group price' })
  @ApiResponse({
    status: 200,
    description: 'Group price updated successfully',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.SUPERADMIN)
  async updateAllGroupPrice(@Body() priceUpdateDto: updateGroupPriceDto) {
    return this.groupService.updateAllGroupsPrice(priceUpdateDto);
  }

  @Post('respond/invite')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Respond to a group invitation (Accept/Reject)' })
  @Roles(UserRole.ADMIN, UserRole.STUDENT, UserRole.SUPERADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  respondInvite(
    @Request() req,
    @Body() respondToGroupInviteDto: respondToGroupInviteDto,
  ) {
    return this.groupService.respondToGroupInvite(
      respondToGroupInviteDto,
      req.user._id,
    );
  }

  @Patch(':groupId/:testId/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.STUDENT, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Update test status by group admin or manager' })
  @ApiBody({ type: updateStatusOfTestDto })
  async updateTestStatus(
    @Param('groupId') groupId: string,
    @Param('testId') testId: string,
    @Body() status: updateStatusOfTestDto,
    @Request() req,
  ) {
    const userId = req.user._id;
    return await this.groupService.updateGroupTestStatus(
      groupId,
      testId,
      userId,
      status,
    );
  }

  @Patch(':groupId/add/:testId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.STUDENT, UserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'Add global tests to his group by group admin or manager',
  })
  async addTest(
    @Param('groupId') groupId: string,
    @Param('testId') testId: string,
    @Request() req,
  ) {
    const userId = req.user._id;
    return await this.groupService.addTestToGroup(groupId, testId, userId);
  }

  @Get(':groupId/search-members')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.STUDENT, UserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'Search group members by their phoneNumber or Name',
  })
  @ApiQuery({
    name: 'phoneNumber',
    required: false,
    type: String,
    description: 'Phone number to search (optional)',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    type: String,
    description: 'Name to search (optional)',
  })
  async searchMembers(
    @Param('groupId') groupId: string,
    @Query('phoneNumber') phoneNumber?: string,
    @Query('name') name?: string,
  ) {
    return this.groupService.searchMembers(groupId, phoneNumber, name);
  }

  @Get('group-tests/:groupId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.STUDENT, UserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'fetch group tests by group admin and manager',
  })
  async getGroupTests(@Param('groupId') groupId: string, @Request() req) {
    return this.groupService.getTestsForGroupByAdminManager(
      req.user._id,
      groupId,
    );
  }
}
