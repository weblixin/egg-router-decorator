import 'reflect-metadata';
export declare function Prefix(pathPrefix?: string): ClassDecorator;
export declare const prefix: typeof Prefix;
export declare function All(path?: string): MethodDecorator;
export declare const all: typeof All;
export declare function Get(path?: string): MethodDecorator;
export declare const get: typeof Get;
export declare function Post(path?: string): MethodDecorator;
export declare const post: typeof Post;
export declare function Put(path?: string): MethodDecorator;
export declare const put: typeof Put;
export declare function Delete(path?: string): MethodDecorator;
export declare const _delete: typeof Delete;
export declare function Patch(path?: string): MethodDecorator;
export declare const patch: typeof Patch;
export declare function Options(path?: string): MethodDecorator;
export declare const options: typeof Options;
export declare function Head(path?: string): MethodDecorator;
export declare const head: typeof Head;
