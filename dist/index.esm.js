import { join } from 'app/package/egg-aop-decorator/dist/path';
import 'reflect-metadata';
import { deprecate } from 'util';
import debug from 'debug';
import isEqual from 'lodash.isequal';
import uniqWith from 'lodash.uniqwith';
import { IncomingForm } from 'formidable';

const ORIGIN_METHOD_METADATA = 'ORIGIN_METHOD_METADATA';
const CONTROLLER_PREFIX_METADATA = 'CONTROLLER_PREFIX_METADATA';
const METHOD_PATH_METADATA = 'METHOD_PATH_METADATA';
const BODYPARSER_METADATA = 'BODYPARSER_METADATA';
const PARAMETER_METADATA = 'PARAMETER_METADATA';
const PARAM_METADATA = 'PARAM_METADATA';
const QUERY_METADATA = 'QUERY_METADATA';
const BODY_METADATA = 'BODY_METADATA';
const FILE_METADATA = 'FILE_METADATA';
const FILES_METADATA = 'FILES_METADATA';
const NULLABLE_METADATA = 'NULLABLE_METADATA';

class ClassFormattor {
    constructor(namedParam, params, queries, body, from, paramName) {
        this.namedParam = namedParam;
        this.params = params;
        this.queries = queries;
        this.body = body;
        this.from = from;
        this.paramName = paramName;
        this.format();
    }
}
exports.ClassFormattor = class {
    constructor(namedParam, params, queries, body, from, paramName) {
        this.namedParam = namedParam;
        this.params = params;
        this.queries = queries;
        this.body = body;
        this.from = from;
        this.paramName = paramName;
        this.format();
    }
};
let EDataType;
(function(EDataType) {
    EDataType[EDataType.Any = 1] = 'Any';
    EDataType[EDataType.Number = 2] = 'Number';
    EDataType[EDataType.String = 3] = 'String';
    EDataType[EDataType.Boolean = 4] = 'Boolean';
})(EDataType || (EDataType = {}));
let RequestMethod;
(function(RequestMethod) {
    RequestMethod.ALL = 'all';
    RequestMethod.GET = 'get';
    RequestMethod.POST = 'post';
    RequestMethod.PUT = 'put';
    RequestMethod.DELETE = 'delete';
    RequestMethod.PATCH = 'patch';
    RequestMethod.OPTIONS = 'options';
    RequestMethod.HEAD = 'head';
})(RequestMethod || (RequestMethod = {}));

const log = debug('egg-aop-decorator:utils');
function parseDate(date) {
    if (/^\d+$/.test(date)) {
        return new Date(Number(date));
    }
    return new Date(date);
}
const getDesignParamTypes = (() => {
    const paramTypes = new Map();
    return (target, methodName, index) => {
        const cacheClass = paramTypes.get(target) || {};
        const cacheParams = cacheClass[methodName];
        if (cacheParams) {
            return cacheParams[index];
        }
        const types = Reflect.getMetadata('design:paramtypes', target, methodName) || [];
        log('[%s::%s] get design paramtypes -> [%s]', target.name, methodName, types.map((type, i) => `param${i}: ${type.name}`).join(', '));
        cacheClass[methodName] = types;
        paramTypes.set(target, cacheClass);
        return types[index];
    };
})();
function defineMethodPath(method, path, target, targetClass) {
    const originMethod = Reflect.getMetadata(ORIGIN_METHOD_METADATA, target);
    controllerMap.set(targetClass, targetClass);
    log('[%s%s] defined request -> [%s]%s', targetClass ? targetClass.name + ' ' : '', (originMethod || target).name, method, path);
    const definedMethodPaths = Reflect.getMetadata(METHOD_PATH_METADATA, target) || [];
    definedMethodPaths.push({ method, path });
    Reflect.defineMetadata(METHOD_PATH_METADATA, uniqWith(definedMethodPaths, isEqual), originMethod || target);
}
const generalParameterDecorator = type => (paramNameOrTarget, methodNameOrDataType, parameterIndex) => {
    let paramName;
    let dataType;
    const decorator = (target, methodName, parameterIndex) => {
        if (!dataType) {
            dataType = getDesignParamTypes(target, methodName, parameterIndex);
            if (dataType === Date) {
                dataType = parseDate;
            }
        } else if (typeof dataType !== 'function') {
            switch (dataType) {
                case EDataType.String:
                    dataType = a => String(a);
                    break;
                case EDataType.Number:
                    dataType = a => Number(a);
                    break;
                case EDataType.Boolean:
                    dataType = a => Boolean(a);
                    break;
                case EDataType.Any:
                default:
                    dataType = a => a;
                    break;
            }
        } else if (dataType === Date) {
            dataType = parseDate;
        }
        const params = Reflect.getMetadata(PARAMETER_METADATA, target.constructor, methodName) || [];
        Reflect.defineMetadata(PARAMETER_METADATA, [
            ...params,
            { type, paramName, dataType, paramIndex: parameterIndex },
        ], target.constructor, methodName);
    };
    if (paramNameOrTarget && typeof paramNameOrTarget === 'string') {
        paramName = paramNameOrTarget;
        if (methodNameOrDataType !== undefined && typeof methodNameOrDataType !== 'string' && typeof methodNameOrDataType !== 'symbol') {
            dataType = methodNameOrDataType;
        }
    }
    if (paramNameOrTarget && typeof paramNameOrTarget === 'object') {
        decorator(paramNameOrTarget, methodNameOrDataType, parameterIndex);
    }
    return decorator;
};
const nullableDecorator = type => (target, methodName) => {
    Reflect.defineMetadata(type, { nullable: true }, target.constructor, methodName);
};
async function parseFiles(context) {
    if (context.files) {
        return Promise.resolve();
    }
    const form = new IncomingForm();
    const { req } = context;
    return new Promise((resolve, reject) => {
        form.parse(req, (err, _fields, myFiles) => {
            if (!err) {
                context.files = myFiles || {};
                return resolve();
            }
            reject();
        });
    });
}
function formatter(dataType, paramName, from, context, nullable = false) {
    if (nullable) {
        const v = from === 'body' ? context.request.body[paramName] : context[from][paramName];
        if (v === undefined || v === null) {
            return undefined;
        }
    }
    try {
        return dataType(from === 'body' ? context.request.body[paramName] : context[from][paramName], context.params, context.queries, context.request.body, from, paramName);
    } catch (e) {
        return new dataType(from === 'body' ? context.request.body[paramName] : context[from][paramName], context.params, context.queries, context.request.body, from, paramName);
    }
}

const Param = generalParameterDecorator(PARAM_METADATA);
const param = deprecate(Param, '@param() is deprecated. Use @Param() instead.');
const Query = generalParameterDecorator(QUERY_METADATA);
const query = deprecate(Query, '@query() is deprecated. Use @Query() instead.');
const Body = generalParameterDecorator(BODY_METADATA);
const body = deprecate(Body, '@body() is deprecated. Use @Body() instead.');
const File = generalParameterDecorator(FILE_METADATA);
const file = deprecate(File, '@file() is deprecated. Use @File() instead.');
const Files = generalParameterDecorator(FILES_METADATA);
const files = deprecate(Files, '@files() is deprecated. Use @Files() instead.');
const Nullable = nullableDecorator(NULLABLE_METADATA);
async function getAllParam(context, controller, methodName) {
    const params = (Reflect.getMetadata(PARAMETER_METADATA, controller, methodName) || []).sort((a, b) => a.paramIndex - b.paramIndex);
    const nullable = (Reflect.getMetadata(NULLABLE_METADATA, controller, methodName) || {}).nullable;
    const args = [];
    await Promise.all(params.map((param, index) => {
        switch (param.type) {
            case PARAM_METADATA: {
                args[index] = formatter(param.dataType, param.paramName, 'params', context, nullable);
                break;
            }
            case QUERY_METADATA: {
                args[index] = formatter(param.dataType, param.paramName, 'queries', context, nullable);
                break;
            }
            case BODY_METADATA: {
                args[index] = formatter(param.dataType, param.paramName, 'body', context, nullable);
                break;
            }
            case FILES_METADATA: {
                return (async () => {
                    await parseFiles(context);
                    args[index] = context.files || {};
                })();
            }
            case FILE_METADATA: {
                return (async () => {
                    await parseFiles(context);
                    args[index] = (context.files || {})[param.paramName || ''];
                })();
            }
        }
        return Promise.resolve();
    }));
    return args;
}

const controllerMap = new Map();
const priority = {
    all: 0,
    delete: 1,
    options: 2,
    get: 3,
    head: 4,
    patch: 5,
    put: 6,
    post: 7,
};
let g_router = {};
function RouteShell(app) {
    const { router, config: { basePath = '', shouldParseParameters = true, tracing = false } = {} } = app;
    g_router = router;
    [...controllerMap.values()].map(controller => {
        const controllerPrefixs = [...(Reflect.getMetadata(CONTROLLER_PREFIX_METADATA, controller.constructor) || [''])];
        const isClassBodyParserIgnore = Reflect.getMetadata(BODYPARSER_METADATA, controller.constructor) || false;
        return Object.getOwnPropertyNames(controller).filter(pName => pName !== 'constructor' && pName !== 'pathName' && pName !== 'fullPath').map(pName => {
            const methodPathPairs = [...(Reflect.getMetadata(METHOD_PATH_METADATA, controller[pName]) || [])];
            const isMethodBodyParserIgnore = Reflect.getMetadata(BODYPARSER_METADATA, controller[pName]) || isClassBodyParserIgnore;
            return controllerPrefixs.map(controllerPrefix => methodPathPairs.map(({ method, path }) => ({
                controller, pName,
                path: path.posix.join(basePath, controllerPrefix, path).replace(/(^\.)|(\/$)/g, ''),
                method,
                isBodyParserIgnore: isMethodBodyParserIgnore,
            }))).reduce((pre, cur) => pre.concat(cur), []);
        })
            .reduce((pre, cur) => pre.concat(cur), []);
    }).reduce((pre, cur) => [...pre, ...cur], [])
        .sort((a, b) => {
            if (a.path.length !== b.path.length) {
                return b.path.length - a.path.length;
            }
            if (/\*$/.test(a.path)) {
                return 1;
            }
            if (priority[a.method] !== priority[b.method]) {
                return priority[b.method] - priority[a.method];
            }
            return a.path > b.path ? 1 : -1;
        })
        .forEach(({ controller, pName, path, method, isBodyParserIgnore }) => {
            if (path !== undefined && method !== undefined) {
                app.logger.info(`[RouteMapping]${!isBodyParserIgnore ? ' [BodyParser]\t' : '\t\t'}${`[${method.toUpperCase()}]`.padEnd(8, ' ')} => ${path}`);
                async function wrap(...args) {
                    let parameters = [];
                    if (shouldParseParameters) {
                        parameters = await getAllParam(this, controller.constructor, pName);
                    }
                    if (tracing) {
                        this.state = this.state || {};
                        this.state.tracingOperationName = `${controller.constructor.name}[${pName}]`;
                        this.set('x-envoy-decorator-operation', this.state.tracingOperationName);
                    }
                    const warppedController = new controller.constructor(this);
                    warppedController.isBodyParserIgnore = isBodyParserIgnore;
                    const warpped = warppedController[pName](...parameters, ...args);
                    return warpped;
                }
                if (isBodyParserIgnore) {
                    const paths = Reflect.getMetadata(BODYPARSER_METADATA, g_router) || [];
                    Reflect.defineMetadata(BODYPARSER_METADATA, paths.concat([path]), g_router);
                }
                router[method](path, wrap);
            }
        });
}
const getBodyIgnores = () => {
    const paths = Reflect.getMetadata(BODYPARSER_METADATA, g_router) || [];
    return paths;
};

function Prefix(pathPrefix = '') {
    return targetClass => {
        const pathPrefixes = Reflect.getMetadata(CONTROLLER_PREFIX_METADATA, targetClass) || new Set();
        pathPrefixes.add(pathPrefix);
        Reflect.defineMetadata(CONTROLLER_PREFIX_METADATA, pathPrefixes, targetClass);
    };
}
const prefix = deprecate(Prefix, '@prefix() is deprecated. Use @Prefix() instead.');
function All(path = 'all') {
    return (target, _key, descriptor) => {
        defineMethodPath(RequestMethod.ALL, path, descriptor.value, target);
    };
}
const all = deprecate(All, '@all() is deprecated. Use @All() instead.');
function Get(path = 'get') {
    return (target, _key, descriptor) => {
        defineMethodPath(RequestMethod.GET, path, descriptor.value, target);
    };
}
const get = deprecate(Get, '@get() is deprecated. Use @Get() instead.');
function Post(path = 'post') {
    return (target, _key, descriptor) => {
        defineMethodPath(RequestMethod.POST, path, descriptor.value, target);
    };
}
const post = deprecate(Post, '@post() is deprecated. Use @Post() instead.');
function Put(path = 'put') {
    return (target, _key, descriptor) => {
        defineMethodPath(RequestMethod.PUT, path, descriptor.value, target);
    };
}
const put = deprecate(Put, '@put() is deprecated. Use @Put() instead.');
function Delete(path = 'delete') {
    return (target, _key, descriptor) => {
        defineMethodPath(RequestMethod.DELETE, path, descriptor.value, target);
    };
}
const _delete = deprecate(Delete, '@delete() is deprecated. Use @Delete() instead.');
function Patch(path = 'patch') {
    return (target, _key, descriptor) => {
        defineMethodPath(RequestMethod.PATCH, path, descriptor.value, target);
    };
}
const patch = deprecate(Patch, '@patch() is deprecated. Use @Patch() instead.');
function Options(path = 'options') {
    return (target, _key, descriptor) => {
        defineMethodPath(RequestMethod.OPTIONS, path, descriptor.value, target);
    };
}
const options = deprecate(Options, '@options() is deprecated. Use @Options() instead.');
function Head(path = 'head') {
    return (target, _key, descriptor) => {
        defineMethodPath(RequestMethod.HEAD, path, descriptor.value, target);
    };
}
const head = deprecate(Head, '@head() is deprecated. Use @Head() instead.');

export default RouteShell;
export { RouteShell, getBodyIgnores, ClassFormattor, EDataType, Param, param, Query, query, Body, body, File, file, Files, files, Nullable, getAllParam, Prefix, prefix, All, all, Get, get, Post, post, Put, put, Delete, _delete, Patch, patch, Options, options, Head, head };
