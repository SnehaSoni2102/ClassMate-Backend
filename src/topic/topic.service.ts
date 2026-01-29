import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { topicModule } from './topic.schema';
import { Model } from 'mongoose';
import { questionModule } from 'src/question/question.schema';
import { addTopicDto, updateTopicDto } from './topic.dto';

@Injectable()
export class TopicService {
  constructor(
    @InjectModel(topicModule.name) private topicModule: Model<topicModule>,
    @InjectModel(questionModule.name)
    private questionModule: Model<questionModule>,
  ) {}

  async addTopic(addTopicDto: addTopicDto) {
    const topicName = addTopicDto.name.trim();

    let topic = await this.topicModule.findOne({
      name: { $regex: new RegExp(`^${topicName}$`, 'i') },
    });

    let isNewlyCreated = false;

    if (!topic) {
      topic = await this.topicModule.create({
        name: topicName,
        name_hi: addTopicDto.name_hi,
      });
      isNewlyCreated = true;
    }

    if (addTopicDto.question) {
      const question = await this.questionModule.findById(addTopicDto.question);

      if (!question) {
        throw new NotFoundException(
          'Question not found, please enter correct ID.',
        );
      }

      question.topics = question.topics ?? [];

      const alreadyLinked = question.topics.some(
        (id) => id.toString() === topic._id.toString(),
      );

      if (!alreadyLinked) {
        question.topics.push(topic._id);
        await question.save();

        return {
          message: isNewlyCreated
            ? 'Topic created and linked to question.'
            : 'Existing topic linked to question.',
          data: topic,
          success: true,
        };
      } else {
        return {
          message: 'Topic already linked to this question.',
          data: topic,
          success: true,
        };
      }
    }

    return {
      message: isNewlyCreated ? 'Topic created.' : 'Topic already exists.',
      data: topic,
      success: true,
    };
  }

  async searchTopicsByName(name: string, questionCount: boolean) {
    const regex = new RegExp(name, 'i');

    const topic = await this.topicModule.find({ name: regex });

    const response: any = {
      message: 'Topic(s) searched successfully',
      data: topic,
      success: true,
    };

    if (questionCount) {
      response.totalCount = topic.length;
    }

    return response;
  }

  async updateTopic(id: string, updateDto: updateTopicDto) {
    const topic = await this.topicModule.findById(id);
    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    const updated = await this.topicModule.findByIdAndUpdate(id, updateDto, {
      new: true,
    });

    return {
      message: 'Topic updated successfully',
      data: updated,
      success: true,
    };
  }

  async deleteTopic(id: string) {
    const topic = await this.topicModule.findById(id);
    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    await this.questionModule.updateMany(
      { topic: id },
      { $pull: { topic: id } },
    );

    await this.topicModule.findByIdAndDelete(id);

    return {
      message: 'Topic deleted and unlinked from questions successfully',
      data: topic,
      success: true,
    };
  }

  async fetchOneTopic(id: string) {
    const topic = await this.topicModule.findById(id);

    if (!topic) {
      throw new NotFoundException('Topic not found, please enter correct ID');
    }

    return {
      message: 'Topic fetched successfully',
      data: topic,
      success: true,
    };
  }
}
