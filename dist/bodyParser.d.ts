export declare function IgnoreBodyParse(ignore?: boolean): ClassDecorator & MethodDecorator;
export declare function IgnoreBodyParse(target: object): void;
export declare function IgnoreBodyParse<T>(target: object, key: string, descriptor: TypedPropertyDescriptor<T>): void;
export declare const ignoreBodyParse: typeof IgnoreBodyParse;
