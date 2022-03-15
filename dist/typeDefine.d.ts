import { Context, PlainObject } from "egg";
import { FILE_METADATA, FILES_METADATA, PARAM_METADATA, QUERY_METADATA, BODY_METADATA } from "./constants";
export interface IParameterMetadata {
    type: 'PARAM_METADATA' | 'QUERY_METADATA' | 'BODY_METADATA' | 'FILE_METADATA' | 'FILES_METADATA';
    dataType: Function | (new (...args: any[]) => any);
    paramName?: string;
    queryName?: string;
    bodyName?: string;
    fileName?: string;
    paramIndex: number;
}
export declare abstract class ClassFormattor<IParam = Context['params'], IQuery = PlainObject<string | string[]>, IBody = Context['request']['body']> {
    protected namedParam: any;
    protected params: IParam;
    protected queries: IQuery;
    protected body: IBody;
    protected from: string;
    protected paramName: string;
    constructor(namedParam: any, params: IParam, queries: IQuery, body: IBody, from: string, paramName: string);
    abstract format(): void;
}
export declare type AutoParameterDecorator = ParameterDecorator & (() => ParameterDecorator) & ((paramName: string) => ParameterDecorator) & ((paramName: string, dataType: EDataType | ((namedParam: any, params: Context['params'], queries: Context['queries'], body: Context['request']['body']) => any) | ClassFormattor) => ParameterDecorator);
export declare type DecoratorType = typeof FILE_METADATA | typeof FILES_METADATA | typeof PARAM_METADATA | typeof QUERY_METADATA | typeof BODY_METADATA;
export declare enum EDataType {
    Any = 1,
    Number = 2,
    String = 3,
    Boolean = 4
}
export declare enum RequestMethod {
    ALL = "all",
    GET = "get",
    POST = "post",
    PUT = "put",
    DELETE = "delete",
    PATCH = "patch",
    OPTIONS = "options",
    HEAD = "head"
}
export interface IMethodPathPair {
    method: RequestMethod;
    path: string;
}
