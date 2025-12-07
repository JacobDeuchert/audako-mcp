import { ConfigurationEntity, Field } from "audako-core";

export abstract class ConfigurationEntityDTO {
  public id?: string;
  public name?: string;
  public description?: string;
  public groupId?: string;
  public path?: string[];

  protected static fromEntity<T extends ConfigurationEntityDTO>(
    entity: ConfigurationEntity,
    dto: T
  ): T {
    dto.id = entity.Id;
    dto.name = entity.Name?.Value;
    dto.description = entity.Description?.Value;
    dto.groupId = entity.GroupId;
    dto.path = entity.Path ? [...entity.Path] : undefined;
    return dto;
  }

  protected applyToEntity(entity: ConfigurationEntity): void {
    if (this.id !== undefined) entity.Id = this.id;
    if (this.name !== undefined) entity.Name = new Field(this.name);
    if (this.description !== undefined) entity.Description = new Field(this.description);
    if (this.groupId !== undefined) entity.GroupId = this.groupId;
    if (this.path !== undefined) entity.Path = [...this.path];
  }
}
