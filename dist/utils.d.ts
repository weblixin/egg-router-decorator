import { Context } from 'egg';
import 'reflect-metadata';
import { RequestMethod, DecoratorType, AutoParameterDecorator } from "./typeDefine";
import { Fields, Files } from 'formidable';
export declare function parseDate(date: string): Date;
export declare const getDesignParamTypes: (target: any, methodName: string, index: number) => Function | FunctionConstructor;
export declare function defineMethodPath(method: RequestMethod, path: string, target: any, targetClass?: any): void;
export declare const generalParameterDecorator: (type: DecoratorType) => AutoParameterDecorator;
export declare const nullableDecorator: (type: "NULLABLE_METADATA") => ParameterDecorator;
export declare function parseFiles(context: Context): Promise<void | {
    fields: Fields;
    files: Files;
}>;
export declare const parsedQuery: unique symbol;
export declare function getParsedQuery(context: any): any;
export declare function formatter(dataType: Function, paramName: string, from: 'params' | 'queries' | 'body', context: Context, nullable?: boolean): any;
