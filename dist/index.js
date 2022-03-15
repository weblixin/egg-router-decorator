'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var path = require('path');
require('reflect-metadata');
var util = require('util');
var debug = _interopDefault(require('debug'));
var isEqual = _interopDefault(require('lodash.isequal'));
var uniqWith = _interopDefault(require('lodash.uniqwith'));
var formidable = require('formidable');

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
(function (EDataType) {
    EDataType[EDataType["Any"] = 1] = "Any";
    EDataType[EDataType["Number"] = 2] = "Number";
    EDataType[EDataType["String"] = 3] = "String";
    EDataType[EDataType["Boolean"] = 4] = "Boolean";
})(exports.EDataType || (exports.EDataType = {}));
var RequestMethod;
(function (RequestMethod) {
    RequestMethod["ALL"] = "all";
    RequestMethod["GET"] = "get";
    RequestMethod["POST"] = "post";
    RequestMethod["PUT"] = "put";
    RequestMethod["DELETE"] = "delete";
    RequestMethod["PATCH"] = "patch";
    RequestMethod["OPTIONS"] = "options";
    RequestMethod["HEAD"] = "head";
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
function defineMethodPath(method, path$$1, target, targetClass) {
    const originMethod = Reflect.getMetadata(ORIGIN_METHOD_METADATA, target);
    controllerMap.set(targetClass, targetClass);
    log('[%s%s] defined request -> [%s]%s', targetClass ? targetClass.name + ' ' : '', (originMethod || target).name, method, path$$1);
    const definedMethodPaths = Reflect.getMetadata(METHOD_PATH_METADATA, target) || [];
    definedMethodPaths.push({ method, path: path$$1 });
    Reflect.defineMetadata(METHOD_PATH_METADATA, uniqWith(definedMethodPaths, isEqual), originMethod || target);
}
const generalParameterDecorator = (type) => (paramNameOrTarget, methodNameOrDataType, parameterIndex) => {
    let paramName;
    let dataType;
    const decorator = (target, methodName, parameterIndex) => {
        if (!dataType) {
            dataType = getDesignParamTypes(target, methodName, parameterIndex);
            if (dataType === Date) {
                dataType = parseDate;
            }
        }
        else if (typeof dataType !== 'function') {
            switch (dataType) {
                case exports.EDataType.String:
                    dataType = (a) => String(a);
                    break;
                case exports.EDataType.Number:
                    dataType = (a) => Number(a);
                    break;
                case exports.EDataType.Boolean:
                    dataType = (a) => Boolean(a);
                    break;
                case exports.EDataType.Any:
                default:
                    dataType = (a) => a;
                    break;
            }
        }
        else if (dataType === Date) {
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
const nullableDecorator = (type) => (target, methodName) => {
    Reflect.defineMetadata(type, { nullable: true }, target.constructor, methodName);
};
async function parseFiles(context) {
    if (context.files) {
        return Promise.resolve();
    }
    const form = new formidable.IncomingForm();
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
    }
    catch (e) {
        return new dataType(from === 'body' ? context.request.body[paramName] : context[from][paramName], context.params, context.queries, context.request.body, from, paramName);
    }
}

const Param = generalParameterDecorator(PARAM_METADATA);
const param = util.deprecate(Param, '@param() is deprecated. Use @Param() instead.');
const Query = generalParameterDecorator(QUERY_METADATA);
const query = util.deprecate(Query, '@query() is deprecated. Use @Query() instead.');
const Body = generalParameterDecorator(BODY_METADATA);
const body = util.deprecate(Body, '@body() is deprecated. Use @Body() instead.');
const File = generalParameterDecorator(FILE_METADATA);
const file = util.deprecate(File, '@file() is deprecated. Use @File() instead.');
const Files = generalParameterDecorator(FILES_METADATA);
const files = util.deprecate(Files, '@files() is deprecated. Use @Files() instead.');
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
    [...controllerMap.values()].map((controller) => {
        const controllerPrefixs = [...(Reflect.getMetadata(CONTROLLER_PREFIX_METADATA, controller.constructor) || [''])];
        const isClassBodyParserIgnore = Reflect.getMetadata(BODYPARSER_METADATA, controller.constructor) || false;
        return Object.getOwnPropertyNames(controller).filter((pName) => pName !== 'constructor' && pName !== 'pathName' && pName !== 'fullPath').map((pName) => {
            const methodPathPairs = [...(Reflect.getMetadata(METHOD_PATH_METADATA, controller[pName]) || [])];
            const isMethodBodyParserIgnore = Reflect.getMetadata(BODYPARSER_METADATA, controller[pName]) || isClassBodyParserIgnore;
            return controllerPrefixs.map(controllerPrefix => methodPathPairs.map(({ method, path: path$$1 }) => ({
                controller, pName,
                path: path.join(basePath, controllerPrefix, path$$1).replace(/(^\.)|(\/$)/g, ''),
                method,
                isBodyParserIgnore: isMethodBodyParserIgnore,
            }))).reduce((pre, cur) => pre.concat(cur), []);
        }).reduce((pre, cur) => pre.concat(cur), []);
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
        .forEach(({ controller, pName, path: path$$1, method, isBodyParserIgnore }) => {
        if (path$$1 !== undefined && method !== undefined) {
            app.logger.info(`[RouteMapping]${!isBodyParserIgnore ? ' [BodyParser]\t' : '\t\t'}${`[${method.toUpperCase()}]`.padEnd(8, ' ')} => ${path$$1}`);
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
                Reflect.defineMetadata(BODYPARSER_METADATA, paths.concat([path$$1]), g_router);
            }
            router[method](path$$1, wrap);
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
const prefix = util.deprecate(Prefix, '@prefix() is deprecated. Use @Prefix() instead.');
function All(path$$1 = 'all') {
    return (target, _key, descriptor) => {
        defineMethodPath(RequestMethod.ALL, path$$1, descriptor.value, target);
    };
}
const all = util.deprecate(All, '@all() is deprecated. Use @All() instead.');
function Get(path$$1 = 'get') {
    return (target, _key, descriptor) => {
        defineMethodPath(RequestMethod.GET, path$$1, descriptor.value, target);
    };
}
const get = util.deprecate(Get, '@get() is deprecated. Use @Get() instead.');
function Post(path$$1 = 'post') {
    return (target, _key, descriptor) => {
        defineMethodPath(RequestMethod.POST, path$$1, descriptor.value, target);
    };
}
const post = util.deprecate(Post, '@post() is deprecated. Use @Post() instead.');
function Put(path$$1 = 'put') {
    return (target, _key, descriptor) => {
        defineMethodPath(RequestMethod.PUT, path$$1, descriptor.value, target);
    };
}
const put = util.deprecate(Put, '@put() is deprecated. Use @Put() instead.');
function Delete(path$$1 = 'delete') {
    return (target, _key, descriptor) => {
        defineMethodPath(RequestMethod.DELETE, path$$1, descriptor.value, target);
    };
}
const _delete = util.deprecate(Delete, '@delete() is deprecated. Use @Delete() instead.');
function Patch(path$$1 = 'patch') {
    return (target, _key, descriptor) => {
        defineMethodPath(RequestMethod.PATCH, path$$1, descriptor.value, target);
    };
}
const patch = util.deprecate(Patch, '@patch() is deprecated. Use @Patch() instead.');
function Options(path$$1 = 'options') {
    return (target, _key, descriptor) => {
        defineMethodPath(RequestMethod.OPTIONS, path$$1, descriptor.value, target);
    };
}
const options = util.deprecate(Options, '@options() is deprecated. Use @Options() instead.');
function Head(path$$1 = 'head') {
    return (target, _key, descriptor) => {
        defineMethodPath(RequestMethod.HEAD, path$$1, descriptor.value, target);
    };
}
const head = util.deprecate(Head, '@head() is deprecated. Use @Head() instead.');

exports.RouteShell = RouteShell;
exports.getBodyIgnores = getBodyIgnores;
exports.default = RouteShell;
exports.ClassFormattor = ClassFormattor;
exports.Param = Param;
exports.param = param;
exports.Query = Query;
exports.query = query;
exports.Body = Body;
exports.body = body;
exports.File = File;
exports.file = file;
exports.Files = Files;
exports.files = files;
exports.Nullable = Nullable;
exports.getAllParam = getAllParam;
exports.Prefix = Prefix;
exports.prefix = prefix;
exports.All = All;
exports.all = all;
exports.Get = Get;
exports.get = get;
exports.Post = Post;
exports.post = post;
exports.Put = Put;
exports.put = put;
exports.Delete = Delete;
exports._delete = _delete;
exports.Patch = Patch;
exports.patch = patch;
exports.Options = Options;
exports.options = options;
exports.Head = Head;
exports.head = head;
