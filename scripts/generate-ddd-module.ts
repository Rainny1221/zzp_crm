#!/usr/bin/env ts-node

/**
 * DDD Module Scaffold Generator
 *
 * Generates a complete DDD 4-layer module structure matching
 * the project's established architecture conventions.
 *
 * Usage:
 *   npx ts-node scripts/generate-ddd-module.ts <module-name> [entity-name]
 *
 * Examples:
 *   npx ts-node scripts/generate-ddd-module.ts post
 *   npx ts-node scripts/generate-ddd-module.ts post Post
 *   npx ts-node scripts/generate-ddd-module.ts matching Match
 *
 * If entity-name is omitted, it defaults to the PascalCase of module-name.
 */

import * as fs from 'fs';
import * as path from 'path';

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

function toPascalCase(str: string): string {
  return str
    .split(/[-_]/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join('');
}

function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .toLowerCase();
}

function toScreamingSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toUpperCase();
}

function mkdirSafe(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`  📁 ${path.relative(process.cwd(), dirPath)}/`);
  }
}

function writeFileSafe(filePath: string, content: string): void {
  if (fs.existsSync(filePath)) {
    console.log(`  ⚠️  SKIP (exists): ${path.relative(process.cwd(), filePath)}`);
    return;
  }
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`  ✅ ${path.relative(process.cwd(), filePath)}`);
}

// ────────────────────────────────────────────────────────────────
// Template generators
// ────────────────────────────────────────────────────────────────

function domainEventBase(): string {
  return `export interface DomainEvent {
  readonly eventName: string;
  readonly occurredOn: Date;
}
`;
}

// ─── Domain Layer ───────────────────────────────────────────────

function entityTemplate(entity: string, moduleName: string): string {
  const kebab = toKebabCase(entity);
  return `import { DomainEvent } from 'src/modules/shared/domain/domain-event.base';
import { ${entity}CreatedEvent } from '../events/${kebab}-created.event';

export interface Create${entity}Props {
  id?: number;
  // TODO: add your entity properties here
}

export class ${entity}Entity {
  private _domainEvents: DomainEvent[] = [];

  private constructor(
    private readonly _id: number,
    // TODO: add private fields here
  ) {}

  static create(props: Create${entity}Props): ${entity}Entity {
    const entity = new ${entity}Entity(
      props.id ?? 0,
      // TODO: map props to constructor args
    );
    entity._domainEvents.push(new ${entity}CreatedEvent(entity._id));
    return entity;
  }

  // Used when loading from database via mapper
  static reconstitute(props: Create${entity}Props & { id: number }): ${entity}Entity {
    return new ${entity}Entity(
      props.id,
      // TODO: map props to constructor args
    );
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }

  // Getters
  get id(): number {
    return this._id;
  }

  // TODO: add getters and business methods
}
`;
}

function domainEventTemplate(entity: string, eventName: string): string {
  return `import { DomainEvent } from 'src/modules/shared/domain/domain-event.base';

export class ${entity}${eventName}Event implements DomainEvent {
  readonly eventName = '${entity}${eventName}';
  readonly occurredOn: Date;

  constructor(public readonly ${toCamelCase(entity)}Id: number) {
    this.occurredOn = new Date();
  }
}
`;
}

function repositoryInterfaceTemplate(entity: string): string {
  const screamingSnake = toScreamingSnakeCase(entity);
  return `import { ${entity}Entity } from '../entities/${toKebabCase(entity)}.entity';

export const I_${screamingSnake}_REPOSITORY = Symbol('I_${screamingSnake}_REPOSITORY');

export interface I${entity}Repository {
  findById(id: number): Promise<${entity}Entity | null>;
  save(entity: ${entity}Entity): Promise<${entity}Entity>;
  // TODO: add more repository methods as needed
}
`;
}

function domainModuleTemplate(moduleName: string): string {
  const pascal = toPascalCase(moduleName);
  return `import { Module } from '@nestjs/common';

@Module({})
export class ${pascal}DomainModule {}
`;
}

// ─── Infrastructure Layer ───────────────────────────────────────

function prismaMapperTemplate(entity: string): string {
  const kebab = toKebabCase(entity);
  return `import { ${entity}Entity } from '../../domain/entities/${kebab}.entity';

// TODO: Define the shape returned by Prisma query
interface Prisma${entity}Raw {
  id: number;
  // TODO: add Prisma model fields
}

export class ${entity}PrismaMapper {
  static toDomain(raw: Prisma${entity}Raw): ${entity}Entity {
    return ${entity}Entity.reconstitute({
      id: raw.id,
      // TODO: map Prisma fields → domain props
    });
  }

  static toCreatePersistence(entity: ${entity}Entity) {
    return {
      // TODO: map domain entity → Prisma create input
    };
  }

  static toUpdatePersistence(entity: ${entity}Entity) {
    return {
      // TODO: map domain entity → Prisma update input
    };
  }
}
`;
}

function prismaRepositoryTemplate(entity: string): string {
  const kebab = toKebabCase(entity);
  const screamingSnake = toScreamingSnakeCase(entity);
  const camel = toCamelCase(entity);
  return `import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { I${entity}Repository } from '../../domain/repositories/i-${kebab}.repository';
import { ${entity}Entity } from '../../domain/entities/${kebab}.entity';
import { ${entity}PrismaMapper } from './${kebab}.prisma-mapper';

@Injectable()
export class ${entity}PrismaRepository implements I${entity}Repository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<${entity}Entity | null> {
    const raw = await this.prisma.${camel}.findUnique({
      where: { id },
    });

    if (!raw) return null;
    return ${entity}PrismaMapper.toDomain(raw as any);
  }

  async save(entity: ${entity}Entity): Promise<${entity}Entity> {
    const data = ${entity}PrismaMapper.toUpdatePersistence(entity);

    const raw = await this.prisma.${camel}.update({
      where: { id: entity.id },
      data,
    });

    return ${entity}PrismaMapper.toDomain(raw as any);
  }
}
`;
}

function infrastructureModuleTemplate(moduleName: string, entity: string): string {
  const pascal = toPascalCase(moduleName);
  const kebab = toKebabCase(entity);
  const screamingSnake = toScreamingSnakeCase(entity);
  return `import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { I_${screamingSnake}_REPOSITORY } from '../domain/repositories/i-${kebab}.repository';
import { ${entity}PrismaRepository } from './persistence/${kebab}.prisma-repository';

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: I_${screamingSnake}_REPOSITORY,
      useClass: ${entity}PrismaRepository,
    },
  ],
  exports: [I_${screamingSnake}_REPOSITORY],
})
export class ${pascal}InfrastructureModule {}
`;
}

// ─── Application Layer ──────────────────────────────────────────

function queryTemplate(entity: string, action: string): string {
  return `export class ${action}${entity}Query {
  constructor(public readonly id: number) {}
}
`;
}

function queryHandlerTemplate(entity: string, action: string, moduleName: string): string {
  const kebab = toKebabCase(entity);
  const screamingSnake = toScreamingSnakeCase(entity);
  const actionKebab = toKebabCase(action);
  return `import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { I${entity}Repository } from '../../domain/repositories/i-${kebab}.repository';
import { I_${screamingSnake}_REPOSITORY } from '../../domain/repositories/i-${kebab}.repository';
import { ${action}${entity}Query } from './${actionKebab}-${kebab}.query';

@QueryHandler(${action}${entity}Query)
export class ${action}${entity}Handler implements IQueryHandler<${action}${entity}Query> {
  private readonly repo: I${entity}Repository;

  constructor(
    @Inject(I_${screamingSnake}_REPOSITORY)
    repo: any,
  ) {
    this.repo = repo;
  }

  async execute(query: ${action}${entity}Query) {
    const entity = await this.repo.findById(query.id);
    if (!entity) return null;

    // TODO: map to response DTO
    return {
      id: entity.id,
    };
  }
}
`;
}

function commandTemplate(entity: string, action: string): string {
  return `export class ${action}${entity}Command {
  constructor(
    // TODO: add command properties
    public readonly id: number,
  ) {}
}
`;
}

function commandHandlerTemplate(entity: string, action: string): string {
  const kebab = toKebabCase(entity);
  const screamingSnake = toScreamingSnakeCase(entity);
  const actionKebab = toKebabCase(action);
  return `import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import type { I${entity}Repository } from '../../domain/repositories/i-${kebab}.repository';
import { I_${screamingSnake}_REPOSITORY } from '../../domain/repositories/i-${kebab}.repository';
import { ${action}${entity}Command } from './${actionKebab}-${kebab}.command';

@CommandHandler(${action}${entity}Command)
export class ${action}${entity}Handler implements ICommandHandler<${action}${entity}Command> {
  private readonly repo: I${entity}Repository;
  private readonly eventBus: EventBus;

  constructor(
    @Inject(I_${screamingSnake}_REPOSITORY)
    repo: any,
    eventBus: EventBus,
  ) {
    this.repo = repo;
    this.eventBus = eventBus;
  }

  async execute(command: ${action}${entity}Command) {
    // TODO: implement command logic
    // 1. Load entity from repository
    // 2. Call domain method
    // 3. Persist changes
    // 4. Dispatch domain events

    const entity = await this.repo.findById(command.id);
    if (!entity) {
      throw new Error('${entity} not found');
    }

    const saved = await this.repo.save(entity);

    const events = entity.pullDomainEvents();
    events.forEach((e) => this.eventBus.publish(e));

    return { id: saved.id };
  }
}
`;
}

function commandsIndexTemplate(entity: string, action: string): string {
  const kebab = toKebabCase(entity);
  const actionKebab = toKebabCase(action);
  return `export { ${action}${entity}Command } from './${actionKebab}-${kebab}.command';
export { ${action}${entity}Handler } from './${actionKebab}-${kebab}.handler';
`;
}

function queriesIndexTemplate(entity: string, action: string): string {
  const kebab = toKebabCase(entity);
  const actionKebab = toKebabCase(action);
  return `export { ${action}${entity}Query } from './${actionKebab}-${kebab}.query';
export { ${action}${entity}Handler } from './${actionKebab}-${kebab}.handler';
`;
}

function applicationModuleTemplate(moduleName: string, entity: string): string {
  const pascal = toPascalCase(moduleName);
  return `import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ${pascal}InfrastructureModule } from '../infrastructure/${toKebabCase(moduleName)}.infrastructure.module';
import { Get${entity}Handler } from './queries';
import { Create${entity}Handler } from './commands';

const QueryHandlers = [Get${entity}Handler];
const CommandHandlers = [Create${entity}Handler];

@Module({
  imports: [CqrsModule, ${pascal}InfrastructureModule],
  providers: [...QueryHandlers, ...CommandHandlers],
})
export class ${pascal}ApplicationModule {}
`;
}

// ─── Presentation Layer ─────────────────────────────────────────

function controllerTemplate(moduleName: string, entity: string): string {
  const pascal = toPascalCase(moduleName);
  const kebab = toKebabCase(moduleName);
  const entityKebab = toKebabCase(entity);
  return `import { Body, Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { Get${entity}Query } from '../application/queries/get-${entityKebab}.query';
import { Create${entity}Command } from '../application/commands/create-${entityKebab}.command';

@ApiTags('${pascal}')
@ApiBearerAuth('access-token')
@Controller('${kebab}')
export class ${pascal}Controller {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get(':id')
  @UseGuards(AuthGuard)
  getById(@Param('id') id: string) {
    return this.queryBus.execute(new Get${entity}Query(+id));
  }

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() data: any) {
    // TODO: use proper DTO and map to command
    return this.commandBus.execute(new Create${entity}Command(data));
  }
}
`;
}

function presenterTemplate(moduleName: string, entity: string): string {
  const pascal = toPascalCase(moduleName);
  const entityKebab = toKebabCase(entity);
  return `import { ${entity}Entity } from '../domain/entities/${entityKebab}.entity';

export class ${pascal}Presenter {
  static toResponse(entity: ${entity}Entity) {
    return {
      id: entity.id,
      // TODO: map domain entity fields to response shape
    };
  }
}
`;
}

function createDtoTemplate(entity: string): string {
  const kebab = toKebabCase(entity);
  return `import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const Create${entity}Schema = z.object({
  // TODO: define Zod validation schema
});

export class Create${entity}Dto extends createZodDto(Create${entity}Schema) {}
`;
}

function updateDtoTemplate(entity: string): string {
  return `import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const Update${entity}Schema = z.object({
  // TODO: define Zod validation schema
});

export class Update${entity}Dto extends createZodDto(Update${entity}Schema) {}
`;
}

// ─── Root Module ────────────────────────────────────────────────

function rootModuleTemplate(moduleName: string): string {
  const pascal = toPascalCase(moduleName);
  const kebab = toKebabCase(moduleName);
  return `import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ${pascal}DomainModule } from './domain/${kebab}.domain.module';
import { ${pascal}InfrastructureModule } from './infrastructure/${kebab}.infrastructure.module';
import { ${pascal}ApplicationModule } from './application/${kebab}.application.module';
import { ${pascal}Controller } from './presentation/${kebab}.controller';

@Module({
  imports: [
    CqrsModule,
    ${pascal}DomainModule,
    ${pascal}InfrastructureModule,
    ${pascal}ApplicationModule,
  ],
  controllers: [${pascal}Controller],
  exports: [${pascal}ApplicationModule, ${pascal}InfrastructureModule],
})
export class ${pascal}Module {}
`;
}

// ────────────────────────────────────────────────────────────────
// Main execution
// ────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error(`
╔═══════════════════════════════════════════════════════════════╗
║              DDD Module Scaffold Generator                    ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  Usage:                                                       ║
║    npx ts-node scripts/generate-ddd-module.ts <name> [entity] ║
║                                                               ║
║  Examples:                                                    ║
║    npx ts-node scripts/generate-ddd-module.ts post            ║
║    npx ts-node scripts/generate-ddd-module.ts post Post       ║
║    npx ts-node scripts/generate-ddd-module.ts matching Match  ║
║                                                               ║
║  Structure generated:                                         ║
║    src/modules/<name>/                                        ║
║    ├── domain/       (entities, VOs, events, repo interfaces) ║
║    ├── infrastructure/ (Prisma mapper, repository impl)       ║
║    ├── application/  (CQRS commands, queries, handlers)       ║
║    ├── presentation/ (controller, DTOs, presenter)            ║
║    └── <name>.module.ts (root module)                         ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);
    process.exit(1);
  }

  const moduleName = args[0].toLowerCase();
  const entityName = args[1] ? toPascalCase(args[1]) : toPascalCase(moduleName);

  const kebabModule = toKebabCase(moduleName);
  const kebabEntity = toKebabCase(entityName);

  const baseDir = path.resolve(__dirname, '..', 'src', 'modules', kebabModule);

  if (fs.existsSync(baseDir)) {
    console.error(`\n❌ Module directory already exists: ${baseDir}`);
    console.error('   Remove it first or choose a different name.\n');
    process.exit(1);
  }

  console.log(`\n🏗️  Generating DDD module: "${kebabModule}" with entity: "${entityName}"\n`);

  // ─── Ensure shared domain exists ────────────────────────────
  const sharedDomainDir = path.resolve(__dirname, '..', 'src', 'modules', 'shared', 'domain');
  const domainEventBasePath = path.join(sharedDomainDir, 'domain-event.base.ts');
  if (!fs.existsSync(domainEventBasePath)) {
    console.log('📦 Creating shared domain base...');
    mkdirSafe(sharedDomainDir);
    writeFileSafe(domainEventBasePath, domainEventBase());
    console.log('');
  }

  // ─── Domain Layer ───────────────────────────────────────────
  console.log('📂 Domain Layer');
  const domainDir = path.join(baseDir, 'domain');
  mkdirSafe(path.join(domainDir, 'entities'));
  mkdirSafe(path.join(domainDir, 'value-objects'));
  mkdirSafe(path.join(domainDir, 'events'));
  mkdirSafe(path.join(domainDir, 'repositories'));
  mkdirSafe(path.join(domainDir, 'services'));

  writeFileSafe(path.join(domainDir, 'entities', `${kebabEntity}.entity.ts`), entityTemplate(entityName, moduleName));
  writeFileSafe(path.join(domainDir, 'events', `${kebabEntity}-created.event.ts`), domainEventTemplate(entityName, 'Created'));
  writeFileSafe(path.join(domainDir, 'repositories', `i-${kebabEntity}.repository.ts`), repositoryInterfaceTemplate(entityName));
  writeFileSafe(path.join(domainDir, `${kebabModule}.domain.module.ts`), domainModuleTemplate(moduleName));
  console.log('');

  // ─── Infrastructure Layer ───────────────────────────────────
  console.log('📂 Infrastructure Layer');
  const infraDir = path.join(baseDir, 'infrastructure');
  mkdirSafe(path.join(infraDir, 'persistence'));
  mkdirSafe(path.join(infraDir, 'services'));

  writeFileSafe(path.join(infraDir, 'persistence', `${kebabEntity}.prisma-mapper.ts`), prismaMapperTemplate(entityName));
  writeFileSafe(path.join(infraDir, 'persistence', `${kebabEntity}.prisma-repository.ts`), prismaRepositoryTemplate(entityName));
  writeFileSafe(path.join(infraDir, `${kebabModule}.infrastructure.module.ts`), infrastructureModuleTemplate(moduleName, entityName));
  console.log('');

  // ─── Application Layer ────────────────────────────────────────
  console.log('📂 Application Layer');
  const appDir = path.join(baseDir, 'application');
  mkdirSafe(path.join(appDir, 'commands'));
  mkdirSafe(path.join(appDir, 'queries'));
  mkdirSafe(path.join(appDir, 'events'));

  // Default query: Get<Entity>
  writeFileSafe(path.join(appDir, 'queries', `get-${kebabEntity}.query.ts`), queryTemplate(entityName, 'Get'));
  writeFileSafe(path.join(appDir, 'queries', `get-${kebabEntity}.handler.ts`), queryHandlerTemplate(entityName, 'Get', moduleName));
  writeFileSafe(path.join(appDir, 'queries', 'index.ts'), queriesIndexTemplate(entityName, 'Get'));

  // Default command: Create<Entity>
  writeFileSafe(path.join(appDir, 'commands', `create-${kebabEntity}.command.ts`), commandTemplate(entityName, 'Create'));
  writeFileSafe(path.join(appDir, 'commands', `create-${kebabEntity}.handler.ts`), commandHandlerTemplate(entityName, 'Create'));
  writeFileSafe(path.join(appDir, 'commands', 'index.ts'), commandsIndexTemplate(entityName, 'Create'));

  writeFileSafe(path.join(appDir, `${kebabModule}.application.module.ts`), applicationModuleTemplate(moduleName, entityName));
  console.log('');

  // ─── Presentation Layer ───────────────────────────────────────
  console.log('📂 Presentation Layer');
  const presDir = path.join(baseDir, 'presentation');
  mkdirSafe(path.join(presDir, 'dto'));

  writeFileSafe(path.join(presDir, `${kebabModule}.controller.ts`), controllerTemplate(moduleName, entityName));
  writeFileSafe(path.join(presDir, `${kebabModule}.presenter.ts`), presenterTemplate(moduleName, entityName));
  writeFileSafe(path.join(presDir, 'dto', `create-${kebabEntity}.dto.ts`), createDtoTemplate(entityName));
  writeFileSafe(path.join(presDir, 'dto', `update-${kebabEntity}.dto.ts`), updateDtoTemplate(entityName));
  console.log('');

  // ─── Root Module ──────────────────────────────────────────────
  console.log('📂 Root Module');
  writeFileSafe(path.join(baseDir, `${kebabModule}.module.ts`), rootModuleTemplate(moduleName));

  // ─── Summary ──────────────────────────────────────────────────
  const pascal = toPascalCase(moduleName);
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║  ✅ Module "${kebabModule}" generated successfully!           
╠═══════════════════════════════════════════════════════════════╣
║                                                               
║  Next steps:                                                  
║                                                               
║  1. Fill in entity properties in:                             
║     domain/entities/${kebabEntity}.entity.ts                  
║                                                               
║  2. Map Prisma model in:                                      
║     infrastructure/persistence/${kebabEntity}.prisma-mapper.ts
║                                                               
║  3. Add to AppModule:                                         
║     import { ${pascal}Module } from './modules/${kebabModule}/${kebabModule}.module';
║     imports: [..., ${pascal}Module]                            
║                                                               
║  4. Run build to verify:                                      
║     pnpm build                                                
║                                                               
╚═══════════════════════════════════════════════════════════════╝
`);
}

main();
