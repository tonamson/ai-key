import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PlansService } from './plans.service';
import { Plan } from './plan.entity';

describe('PlansService', () => {
  let service: PlansService;
  const mockRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PlansService,
        { provide: getRepositoryToken(Plan), useValue: mockRepo },
      ],
    }).compile();
    service = module.get(PlansService);
    jest.clearAllMocks();
  });

  it('findPublic returns only active plans', async () => {
    const plans = [{ id: '1', isActive: true }, { id: '2', isActive: true }];
    mockRepo.find.mockResolvedValue(plans);
    const result = await service.findPublic();
    expect(mockRepo.find).toHaveBeenCalledWith({ where: { isActive: true }, order: { createdAt: 'ASC' } });
    expect(result).toEqual(plans);
  });
});
