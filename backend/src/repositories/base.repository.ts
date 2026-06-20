import { Model, Document, FilterQuery } from 'mongoose';

export class BaseRepository<T extends Document> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async create(data: any): Promise<T> {
    return this.model.create(data);
  }

  async findById(id: string, populate: string[] = []): Promise<T | null> {
    let query = this.model.findById(id) as any;
    populate.forEach((field) => {
      query = query.populate(field);
    });
    return query.exec();
  }

  async findOne(filter: FilterQuery<T>, populate: string[] = []): Promise<T | null> {
    let query = this.model.findOne(filter) as any;
    populate.forEach((field) => {
      query = query.populate(field);
    });
    return query.exec();
  }

  async update(id: string, data: any): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true, runValidators: true }).exec();
  }

  async delete(id: string): Promise<T | null> {
    return this.model.findByIdAndDelete(id).exec();
  }

  async findMany(filter: FilterQuery<T> = {}, populate: string[] = []): Promise<T[]> {
    let query = this.model.find(filter) as any;
    populate.forEach((field) => {
      query = query.populate(field);
    });
    return query.exec();
  }

  async findWithPagination(options: {
    page?: number;
    limit?: number;
    sort?: string;
    filter?: FilterQuery<T>;
    search?: string;
    searchFields?: string[];
    populate?: string[];
  }): Promise<{
    docs: T[];
    totalDocs: number;
    limit: number;
    page: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }> {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 10;
    const skip = (page - 1) * limit;

    let queryFilter: FilterQuery<T> = { ...(options.filter || {}) };

    if (options.search && options.searchFields && options.searchFields.length > 0) {
      const searchRegex = new RegExp(options.search, 'i');
      const searchConditions = options.searchFields.map((field) => ({
        [field]: searchRegex,
      }));
      queryFilter = {
        ...queryFilter,
        $or: searchConditions,
      } as FilterQuery<T>;
    }

    const sortStr = options.sort || '-createdAt';

    let query = this.model.find(queryFilter).sort(sortStr).skip(skip).limit(limit) as any;

    if (options.populate) {
      options.populate.forEach((field) => {
        query = query.populate(field);
      });
    }

    const docs = await query.exec();
    const totalDocs = await this.model.countDocuments(queryFilter);
    const totalPages = Math.ceil(totalDocs / limit);

    return {
      docs,
      totalDocs,
      limit,
      page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }
}

export default BaseRepository;
