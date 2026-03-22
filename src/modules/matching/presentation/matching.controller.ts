import { Body, Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { GetMatchingQuery } from '../application/queries/get-matching.query';
import { CreateMatchingCommand } from '../application/commands/create-matching.command';

@ApiTags('Matching')
@ApiBearerAuth('access-token')
@Controller('matching')
export class MatchingController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get(':id')
  @UseGuards(AuthGuard)
  getById(@Param('id') id: string) {
    return this.queryBus.execute(new GetMatchingQuery(+id));
  }

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() data: any) {
    // TODO: use proper DTO and map to command
    return this.commandBus.execute(new CreateMatchingCommand(data));
  }
}
