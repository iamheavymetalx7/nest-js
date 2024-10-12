import { Injectable, NotFoundException } from '@nestjs/common';
import { TaskStatus } from './task-status.enum';
import { CreateTaskDto } from './dto/create-task.dto';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from './task.entity';
import { Repository } from 'typeorm';
@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  async getTasks(filterDto: GetTasksFilterDto): Promise<Task[]> {
    const { search, status } = filterDto;
    const query = this.tasksRepository.createQueryBuilder('task');

    if (status) {
      query.andWhere('task.status = :status', { status });
    }

    if (search) {
      query.andWhere(
        'LOWER(task.title) LIKE LOWER(:search) OR LOWER(task.description) LIKE LOWER(:search)',
        { search: `%${search}%` },
      );
    }
    const tasks = await query.getMany();
    return tasks;
  }

  //   private tasks: Task[] = [];
  //   getAllTasks(): Task[] {
  //     return this.tasks;
  //   }
  //   getTasksWithFilter(filterDto: GetTasksFilterDto): Task[] {
  //     const { status, search } = filterDto;
  //     let tasks = this.getAllTasks();
  //     if (status) {
  //       tasks = tasks.filter((task) => task.status === status);
  //     }
  //     if (search) {
  //       tasks = tasks.filter((task) => {
  //         if (task.title.includes(search) || task.description.includes(search)) {
  //           return true;
  //         } else {
  //           return false;
  //         }
  //       });
  //     }
  //     return tasks;
  //   }

  async getTaskById(id: string): Promise<Task> {
    console.log('getting ID....');
    const found = await this.tasksRepository.findOne({ where: { id: id } });
    if (!found) {
      throw new NotFoundException(`task with ID ${id} not found`);
    }
    return found;
  }

  //   getTaskById(id: string): Task {
  //     //try to get task
  //     //if not found throw an error (404 not found)
  //     //otherwise return the found task
  //     const found = this.tasks.find((task) => task.id === id);
  //     if (!found) {
  //       throw new NotFoundException(`task with ID ${id} not found`);
  //     }
  //     return found;
  //   }
  //   //   createTask(title: string, description: string): Task {
  //   //     const task: Task = {
  //   //       id: uuid(),
  //   //       title,
  //   //       description,
  //   //       status: TaskStatus.OPEN,
  //   //     };
  //   //     this.tasks.push(task);
  //   //     return task;
  //   //   }

  async createTask(createTaskDto: CreateTaskDto): Promise<Task> {
    const { title, description } = createTaskDto;
    console.log('creating....');
    const task = this.tasksRepository.create({
      title,
      description,
      status: TaskStatus.OPEN,
    });
    await this.tasksRepository.save(task);
    return task;
  }
  //   createTask(createTaskDto: CreateTaskDto) {
  //     const { title, description } = createTaskDto;
  //     const task: Task = {
  //       id: uuid(),
  //       title,
  //       description,
  //       status: TaskStatus.OPEN,
  //     };
  //     this.tasks.push(task);
  //     return task;
  //   }

  async deleteTask(id: string): Promise<void> {
    const result = await this.tasksRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Task with ID ${id} not found!`);
    }
  }
  async updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
    const task = await this.getTaskById(id);

    task.status = status;
    await this.tasksRepository.save(task);

    return task;
  }
}
