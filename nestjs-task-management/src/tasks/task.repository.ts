import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from './task.entity';
import { Repository, DeleteResult } from 'typeorm';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskStatus } from './task-status.enum';
import { User } from 'src/auth/user.entity';
import { Logger } from '@nestjs/common';
@Injectable()
export class TaskRepository {
  private logger = new Logger('TasksRepository');
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  async findTasks(filterDto: GetTasksFilterDto, user: User): Promise<Task[]> {
    const { search, status } = filterDto;
    const query = this.tasksRepository.createQueryBuilder('task');
    query.where({ user });
    if (status) {
      query.andWhere('task.status = :status', { status });
    }

    if (search) {
      query.andWhere(
        '(LOWER(task.title) LIKE LOWER(:search) OR LOWER(task.description) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    try {
      return await query.getMany();
    } catch (error) {
      this.logger.error(
        `Failed to get tasks for the user "${user.username}"`,
        error.stack,
      );

      throw new InternalServerErrorException();
    }
  }

  async findById(id: string, user: User): Promise<Task> {
    return this.tasksRepository.findOne({ where: { id, user } });
  }

  async createTask(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    const { title, description } = createTaskDto;
    const task = this.tasksRepository.create({
      title,
      description,
      status: TaskStatus.OPEN,
      user,
    });
    return await this.tasksRepository.save(task);
  }

  async delete(id: string, user: User): Promise<DeleteResult> {
    return await this.tasksRepository.delete({ id, user });
  }

  async save(task: Task): Promise<Task> {
    return await this.tasksRepository.save(task);
  }
}
