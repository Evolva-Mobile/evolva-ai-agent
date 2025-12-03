import { Body, Controller, Post } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { CreationMissionsDto } from './create-missions.dto';

@Controller('missions')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) { }

  @Post('generate')
  async generate(@Body() dto: CreationMissionsDto) {
    return await this.gamificationService.generateMissions(dto.context);
  }
}
