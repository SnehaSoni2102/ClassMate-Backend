import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CategoryService, CategoryTree } from './category.service';
import { JwtAuthGuard } from 'guards/jwt.guards';
import {
  addCategoryDto,
  fetchCategoryDto,
  getCategoryPriceDto,
  updateCategoryDto,
  updatePriceDto,
} from './category.dto';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles, UserRole } from 'utils/helper';
import { JwtService } from '@nestjs/jwt';

@ApiTags('CATEGORY')
@Controller('category')
export class CategoryController {
  constructor(
    private categoryService: CategoryService,
    private jwtService: JwtService,
  ) {}

  @Post('add')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'add category' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('logo'))
  @ApiResponse({
    status: 201,
    description: 'category added successfully',
    type: addCategoryDto,
  })
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  addCategory(
    @Body() addCategoryDto: addCategoryDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.categoryService.addCategory(addCategoryDto, file);
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STUDENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search categories by name (case-insensitive)' })
  @ApiResponse({
    status: 200,
    description: 'Categories fetched successfully',
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  fetchCategories(@Query() fetchCategoryDto: fetchCategoryDto) {
    return this.categoryService.fetchCategories(fetchCategoryDto);
  }

  @Get('search/exams')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STUDENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Search exams inside each category by name (case-insensitive)',
  })
  @ApiResponse({
    status: 200,
    description: 'Exams and categories fetched successfully',
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  searchExams(
    @Query('query') query: string,
    @Query('questionCount') questionCount: boolean,
  ) {
    return this.categoryService.searchCategoriesAndExams(query, questionCount);
  }

  @Get('all')
  // @UseGuards(JwtAuthGuard)
  // @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STUDENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'fetch all categories' })
  @ApiResponse({
    status: 200,
    description: 'Categories fetched successfully',
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  fetchAllCategory() {
    return this.categoryService.fetchAllCategories();
  }

  @Get('filter')
  @ApiOperation({ summary: 'Get all categories based on language (en/hi)' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'hi'],
    example: 'en',
  })
  @ApiResponse({
    status: 200,
    description: 'List of categories fetched successfully',
  })
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  // @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STUDENT)
  async getCategories(@Query('lang') lang: 'en' | 'hi' = 'en') {
    return this.categoryService.getCategories(lang);
  }

  @Get('exams')
  @ApiOperation({
    summary: 'Get all exams inside a category based on language',
  })
  @ApiQuery({ name: 'categoryName', required: true, example: 'SSC Exam' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'hi'],
    example: 'en',
  })
  @ApiResponse({
    status: 200,
    description: 'List of exams fetched successfully',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STUDENT)
  async getExamsByCategory(
    @Query('categoryName') categoryName: string,
    @Query('lang') lang: 'en' | 'hi' = 'en',
  ) {
    return this.categoryService.getExamsByCategory(categoryName, lang);
  }

  @Get('one/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STUDENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'fetch one category' })
  @ApiResponse({
    status: 200,
    description: 'Category fetched successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found, please enter correct ID',
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  fetchOneCategory(@Param('id') id: string) {
    return this.categoryService.fetchOneCategory(id);
  }

  @Patch('update/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STUDENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'update category' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('logo'))
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully',
    type: updateCategoryDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found, please enter correct ID',
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: updateCategoryDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.categoryService.updateCategory(id, updateCategoryDto, file);
  }

  @Delete('delete/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STUDENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'delete category' })
  @ApiResponse({
    status: 200,
    description: 'Category deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found, please enter correct ID',
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  deleteCategory(@Param('id') id: string) {
    return this.categoryService.deleteCategory(id);
  }

  @Get('tree/:id')
  // @UseGuards(JwtAuthGuard)
  // @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STUDENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'fetch tree categories using root category ID' })
  @ApiResponse({
    status: 200,
    description: 'Categories fetched successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found, please enter correct ID',
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async getCategoryTree(
    @Param('id') id: string,
    @Request() req,
  ): Promise<{ message: string; data: CategoryTree; success: boolean }> {
    let userId: string | undefined;

    const authHeader = req.headers['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const payload: any = this.jwtService.verify(token);
        userId = payload?.data?._id;
      } catch (err) {
        userId = undefined;
      }
    }

    return this.categoryService.getCategoryTree(id, userId);
  }

  @Get('top-level')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'fetch all root categories' })
  @ApiResponse({
    status: 200,
    description: 'Categories fetched successfully',
  })
  async getTopLevelCategories() {
    return this.categoryService.getTopLevelCategories();
  }

  @Patch('update-price/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'update price of a category' })
  @ApiResponse({
    status: 200,
    description: 'Category price updated successfully',
  })
  updatePrice(@Param('id') id: string, @Body() categoryDto: updatePriceDto) {
    return this.categoryService.updatePrice(id, categoryDto);
  }

  @Patch('update-all-prices')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'update price of all top-level categories' })
  @ApiResponse({
    status: 200,
    description: 'All top-level category prices updated successfully',
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  updateAllCategoryPrices(@Body() priceDto: updatePriceDto) {
    return this.categoryService.updateAllCategoryPrices(priceDto);
  }

  @Post('get-prices')
  // @UseGuards(JwtAuthGuard)
  // @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STUDENT)
  // @ApiBearerAuth()
  @ApiOperation({ summary: 'Fetch subscription plans for categories' })
  @ApiResponse({
    status: 200,
    description: 'category prices fetched successfully',
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async getPrices(@Body() dto: getCategoryPriceDto) {
    return this.categoryService.getCategoryPrices(dto);
  }
}
