'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const { isNil } = require('lodash');
const { getCustomLinksService, CUSTOM_LINKS_UID } = require('../utils');
console.log(CUSTOM_LINKS_UID)
module.exports = createCoreController(CUSTOM_LINKS_UID, ({ strapi }) => ({
  async useProxy(ctx) {
    const { uri = '' } = ctx.params;
    const item = await strapi.query(CUSTOM_LINKS_UID).findOne({ where: { uri: `/${uri}` } });
    if (item) {
      const { contentId, kind } = item;
      const query = await getCustomLinksService(strapi).getProxyQuery(kind);
      const hasDraftAndPublish = strapi.contentTypes[kind].options.draftAndPublish;
      let entity;
      if (strapi.contentTypes[kind].kind === 'singleType') {
        console.log('1111')
        entity = await strapi.service(kind).find(query);
      } else {
        console.log('2222')
        entity = await strapi.service(kind).findOne(contentId, query);
        if (hasDraftAndPublish && isNil(entity.publishedAt)) {
          return null;
        }
      }
      const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
      return this.transformResponse(sanitizedEntity);
    }
  },
  async find(ctx) {
    const { query } = ctx;
    const { results, pagination } = await getCustomLinksService(strapi).find(query);
    const sanitizedResults = await this.sanitizeOutput(results, ctx);
    return this.transformResponse(sanitizedResults, { pagination });
  },
  async findOne(ctx) {
    const { id } = ctx.params;
    const { query } = ctx;
    const entity = await getCustomLinksService(strapi).findOne(id, query);
    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },
  async count(ctx) {
    const { query } = ctx;
    const result = await getCustomLinksService(strapi).count(query);
    return result;
  },
  async create(ctx) {
    const data = ctx?.request?.body;
    console.log('create',data)
    const entity = await getCustomLinksService(strapi).create({ data });
    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },
  async update(ctx) {
    const { id } = ctx.params;
    const data = ctx.request.body;
    const entity = await getCustomLinksService(strapi).update(id, { data });
    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },
  async delete(ctx) {
    const { id } = ctx.params;
    const result = await getCustomLinksService(strapi).delete(id);
    return result;
  },
  async deleteMany(ctx) {
    const { ids } = ctx.request.body;
    const result = await getCustomLinksService(strapi).deleteMany(ids);
    return result;
  },
  async checkAvailability(ctx) {
    const { query } = ctx;
    // console.log('-----',query)
    const isAvailable = await getCustomLinksService(strapi).getAvailability(query);
    return isAvailable;
  },
}));
