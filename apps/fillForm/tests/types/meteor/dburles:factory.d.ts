declare module "meteor/dburles:factory" {
  type Name = string;

  type Attributes = object;

  export class Instance {
  }

  export class Factory {
    static define(
      name: Name,
      collection: any,
      attributes: Attributes
    ): Instance;

    static create(task: string): void;
  }

}
