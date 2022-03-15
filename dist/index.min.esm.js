import { join } from 'app/package/egg-aop-decorator/dist/path'; import 'reflect-metadata'; import { deprecate } from 'util'; import debug from 'debug'; import isEqual from 'lodash.isequal'; import uniqWith from 'lodash.uniqwith'; import { IncomingForm } from 'formidable'; const ORIGIN_METHOD_METADATA = 'ORIGIN_METHOD_METADATA',
    CONTROLLER_PREFIX_METADATA = 'CONTROLLER_PREFIX_METADATA',
    METHOD_PATH_METADATA = 'METHOD_PATH_METADATA',
    BODYPARSER_METADATA = 'BODYPARSER_METADATA',
    PARAMETER_METADATA = 'PARAMETER_METADATA',
    PARAM_METADATA = 'PARAM_METADATA',
    QUERY_METADATA = 'QUERY_METADATA',
    BODY_METADATA = 'BODY_METADATA',
    FILE_METADATA = 'FILE_METADATA',
    FILES_METADATA = 'FILES_METADATA',
    NULLABLE_METADATA = 'NULLABLE_METADATA'; class ClassFormattor {constructor(e, t, a, r, o, s) { this.namedParam = e, this.params = t, this.queries = a, this.body = r, this.from = o, this.paramName = s, this.format(); }} let EDataType,
    RequestMethod; exports.ClassFormattor = class {constructor(e, t, a, r, o, s) { this.namedParam = e, this.params = t, this.queries = a, this.body = r, this.from = o, this.paramName = s, this.format(); }}, function(e) { e[e.Any = 1] = 'Any', e[e.Number = 2] = 'Number', e[e.String = 3] = 'String', e[e.Boolean = 4] = 'Boolean'; }(EDataType || (EDataType = {})), function(e) { e.ALL = 'all', e.GET = 'get', e.POST = 'post', e.PUT = 'put', e.DELETE = 'delete', e.PATCH = 'patch', e.OPTIONS = 'options', e.HEAD = 'head'; }(RequestMethod || (RequestMethod = {})); const log = debug('egg-aop-decorator:utils'); function parseDate(e) { return /^\d+$/.test(e) ? new Date(Number(e)) : new Date(e); } const getDesignParamTypes = (() => {
    const e = new Map(); return (t, a, r) => {
        const o = e.get(t) || {},
            s = o[a]; if (s) return s[r]; const n = Reflect.getMetadata('design:paramtypes', t, a) || []; return log('[%s::%s] get design paramtypes -> [%s]', t.name, a, n.map((e, t) => `param${t}: ${e.name}`).join(', ')), o[a] = n, e.set(t, o), n[r];
    };
})(); function defineMethodPath(e, t, a, r) { const o = Reflect.getMetadata(ORIGIN_METHOD_METADATA, a); controllerMap.set(r, r), log('[%s%s] defined request -> [%s]%s', r ? r.name + ' ' : '', (o || a).name, e, t); const s = Reflect.getMetadata(METHOD_PATH_METADATA, a) || []; s.push({ method: e, path: t }), Reflect.defineMetadata(METHOD_PATH_METADATA, uniqWith(s, isEqual), o || a); } const generalParameterDecorator = e => (t, a, r) => {
        let o,
            s; const n = (t, a, r) => { if (s) if (typeof s !== 'function') switch (s) { case EDataType.String:s = e => String(e); break; case EDataType.Number:s = e => Number(e); break; case EDataType.Boolean:s = e => Boolean(e); break; case EDataType.Any:default:s = e => e; } else s === Date && (s = parseDate); else (s = getDesignParamTypes(t, a, r)) === Date && (s = parseDate); const n = Reflect.getMetadata(PARAMETER_METADATA, t.constructor, a) || []; Reflect.defineMetadata(PARAMETER_METADATA, [...n, { type: e, paramName: o, dataType: s, paramIndex: r }], t.constructor, a); }; return t && typeof t === 'string' && (o = t, void 0 !== a && typeof a !== 'string' && typeof a !== 'symbol' && (s = a)), t && typeof t === 'object' && n(t, a, r), n;
    },
    nullableDecorator = e => (t, a) => { Reflect.defineMetadata(e, { nullable: !0 }, t.constructor, a); }; async function parseFiles(e) {
    if (e.files) return Promise.resolve(); const t = new IncomingForm(),
        { req: a } = e; return new Promise((r, o) => { t.parse(a, (t, a, s) => { if (!t) return e.files = s || {}, r(); o(); }); });
} function formatter(e, t, a, r, o = !1) { if (o) { if ((a === 'body' ? r.request.body[t] : r[a][t]) == null) return; } try { return e(a === 'body' ? r.request.body[t] : r[a][t], r.params, r.queries, r.request.body, a, t); } catch (o) { return new e(a === 'body' ? r.request.body[t] : r[a][t], r.params, r.queries, r.request.body, a, t); } } const Param = generalParameterDecorator(PARAM_METADATA),
    param = deprecate(Param, '@param() is deprecated. Use @Param() instead.'),
    Query = generalParameterDecorator(QUERY_METADATA),
    query = deprecate(Query, '@query() is deprecated. Use @Query() instead.'),
    Body = generalParameterDecorator(BODY_METADATA),
    body = deprecate(Body, '@body() is deprecated. Use @Body() instead.'),
    File = generalParameterDecorator(FILE_METADATA),
    file = deprecate(File, '@file() is deprecated. Use @File() instead.'),
    Files = generalParameterDecorator(FILES_METADATA),
    files = deprecate(Files, '@files() is deprecated. Use @Files() instead.'),
    Nullable = nullableDecorator(NULLABLE_METADATA); async function getAllParam(e, t, a) {
    const r = (Reflect.getMetadata(PARAMETER_METADATA, t, a) || []).sort((e, t) => e.paramIndex - t.paramIndex),
        o = (Reflect.getMetadata(NULLABLE_METADATA, t, a) || {}).nullable,
        s = []; return await Promise.all(r.map((t, a) => { switch (t.type) { case PARAM_METADATA:s[a] = formatter(t.dataType, t.paramName, 'params', e, o); break; case QUERY_METADATA:s[a] = formatter(t.dataType, t.paramName, 'queries', e, o); break; case BODY_METADATA:s[a] = formatter(t.dataType, t.paramName, 'body', e, o); break; case FILES_METADATA:return (async () => { await parseFiles(e), s[a] = e.files || {}; })(); case FILE_METADATA:return (async () => { await parseFiles(e), s[a] = (e.files || {})[t.paramName || '']; })(); } return Promise.resolve(); })), s;
} const controllerMap = new Map(),
    priority = { all: 0, delete: 1, options: 2, get: 3, head: 4, patch: 5, put: 6, post: 7 }; let g_router = {}; function RouteShell(e) {
    const { router: t, config: { basePath: a = '', shouldParseParameters: r = !0, tracing: o = !1 } = {} } = e; g_router = t, [...controllerMap.values()].map(e => {
        const t = [...Reflect.getMetadata(CONTROLLER_PREFIX_METADATA, e.constructor) || ['']],
            r = Reflect.getMetadata(BODYPARSER_METADATA, e.constructor) || !1; return Object.getOwnPropertyNames(e).filter(e => e !== 'constructor' && e !== 'pathName' && e !== 'fullPath').map(o => {
            const s = [...Reflect.getMetadata(METHOD_PATH_METADATA, e[o]) || []],
                n = Reflect.getMetadata(BODYPARSER_METADATA, e[o]) || r; return t.map(t => s.map(({ method: r, path: s }) => ({ controller: e, pName: o, path: path.posix.join(a, t, s).replace(/(^\.)|(\/$)/g, ''), method: r, isBodyParserIgnore: n }))).reduce((e, t) => e.concat(t), []);
        })
            .reduce((e, t) => e.concat(t), []);
    }).reduce((e, t) => [...e, ...t], []).sort((e, t) => (e.path.length !== t.path.length ? t.path.length - e.path.length : /\*$/.test(e.path) ? 1 : priority[e.method] !== priority[t.method] ? priority[t.method] - priority[e.method] : e.path > t.path ? 1 : -1))
        .forEach(({ controller: a, pName: s, path: n, method: i, isBodyParserIgnore: A }) => { if (void 0 !== n && void 0 !== i) { if (e.logger.info(`[RouteMapping]${A ? '\t\t' : ' [BodyParser]\t'}${`[${i.toUpperCase()}]`.padEnd(8, ' ')} => ${n}`), A) { const e = Reflect.getMetadata(BODYPARSER_METADATA, g_router) || []; Reflect.defineMetadata(BODYPARSER_METADATA, e.concat([n]), g_router); }t[i](n, async function(...e) { let t = []; r && (t = await getAllParam(this, a.constructor, s)), o && (this.state = this.state || {}, this.state.tracingOperationName = `${a.constructor.name}[${s}]`, this.set('x-envoy-decorator-operation', this.state.tracingOperationName)); const n = new a.constructor(this); return n.isBodyParserIgnore = A, n[s](...t, ...e); }); } });
} const getBodyIgnores = () => Reflect.getMetadata(BODYPARSER_METADATA, g_router) || []; function Prefix(e = '') { return t => { const a = Reflect.getMetadata(CONTROLLER_PREFIX_METADATA, t) || new Set(); a.add(e), Reflect.defineMetadata(CONTROLLER_PREFIX_METADATA, a, t); }; } const prefix = deprecate(Prefix, '@prefix() is deprecated. Use @Prefix() instead.'); function All(e = 'all') { return (t, a, r) => { defineMethodPath(RequestMethod.ALL, e, r.value, t); }; } const all = deprecate(All, '@all() is deprecated. Use @All() instead.'); function Get(e = 'get') { return (t, a, r) => { defineMethodPath(RequestMethod.GET, e, r.value, t); }; } const get = deprecate(Get, '@get() is deprecated. Use @Get() instead.'); function Post(e = 'post') { return (t, a, r) => { defineMethodPath(RequestMethod.POST, e, r.value, t); }; } const post = deprecate(Post, '@post() is deprecated. Use @Post() instead.'); function Put(e = 'put') { return (t, a, r) => { defineMethodPath(RequestMethod.PUT, e, r.value, t); }; } const put = deprecate(Put, '@put() is deprecated. Use @Put() instead.'); function Delete(e = 'delete') { return (t, a, r) => { defineMethodPath(RequestMethod.DELETE, e, r.value, t); }; } const _delete = deprecate(Delete, '@delete() is deprecated. Use @Delete() instead.'); function Patch(e = 'patch') { return (t, a, r) => { defineMethodPath(RequestMethod.PATCH, e, r.value, t); }; } const patch = deprecate(Patch, '@patch() is deprecated. Use @Patch() instead.'); function Options(e = 'options') { return (t, a, r) => { defineMethodPath(RequestMethod.OPTIONS, e, r.value, t); }; } const options = deprecate(Options, '@options() is deprecated. Use @Options() instead.'); function Head(e = 'head') { return (t, a, r) => { defineMethodPath(RequestMethod.HEAD, e, r.value, t); }; } const head = deprecate(Head, '@head() is deprecated. Use @Head() instead.'); export default RouteShell; export { RouteShell, getBodyIgnores, ClassFormattor, EDataType, Param, param, Query, query, Body, body, File, file, Files, files, Nullable, getAllParam, Prefix, prefix, All, all, Get, get, Post, post, Put, put, Delete, _delete, Patch, patch, Options, options, Head, head };
