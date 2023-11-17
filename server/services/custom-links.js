'use strict';

const POPULATE_TYPES = ['relation', 'component', 'dynamiczone'];
const { createCoreService } = require('@strapi/strapi').factories;
const { CUSTOM_LINKS_UID } = require('../utils');

module.exports = createCoreService(CUSTOM_LINKS_UID, ({ strapi }) => ({
  getProxyQuery(kind) {
    console.log('*****************')
    const { attributes } = strapi.contentTypes[kind];
    const populate = {};
    const fields = [];
    Object.entries(attributes).forEach(([attribute, value]) => {
      const vs = Object.prototype.hasOwnProperty.call(value, 'visible') ? value.visible : true;
      const pr = Object.prototype.hasOwnProperty.call(value, 'private') ? value.private : false;
      if (POPULATE_TYPES.includes(value.type) && !pr && vs) {
        if (value.type === 'dynamiczone') {
          populate[attribute] = {
            populate: '*',
          };
        } else {
          populate[attribute] = true;
        }
      } else if (!pr && vs) {
        fields.push(attribute);
      }
    });
    return { fields, populate };
  },
  async count(params) {
    const result = await strapi.db.query(CUSTOM_LINKS_UID).count(params);
    return result;
  },
  async delete(id) {
    const result = await strapi.db.query(CUSTOM_LINKS_UID).delete({
      where: { id },
    });
    return result;
  },
  async deleteMany(ids = []) {
    const entries = [];
    await Promise.all(
      ids.map(async id => {
        const entry = await strapi.db.query(CUSTOM_LINKS_UID).delete({
          where: { id },
        });
        entries.push(entry);
      })
    );
    return {
      count: entries.length,
    };
  },
  async getAvailability({ uri, contentId = '', kind = '' ,type=''}) {
    // console.log('innn',contentId)
    let result;
    if(contentId == 'null'){
      // console.log('oooo')
      result = await strapi.db.query(CUSTOM_LINKS_UID).findMany({
        where: {
          uri,
          $not: {
            kind,
            type
          },
        },
      });
    }
    else{
// console.log('else')
       result = await strapi.db.query(CUSTOM_LINKS_UID).findMany({
        where: {
          uri,
          $not: {
            contentId,
            kind,
            type
          },
        },
      });
    }
    // console.log('result',result)
    return {
      isAvailable: result.length === 0,
      uri,
      contentId,
      kind,
      type
    };
  },

  async checkUrlExistBeforeCreate(entity,uri) {
    // console.log('entity',entity)
    const urlMapperEntity = await strapi.db.query(CUSTOM_LINKS_UID);
    let urlExist = await urlMapperEntity.findOne({
      where: { uri: { $eq: uri }},
    });

    return urlExist;
  },
  async createUrlMapperEntity(data) {
    // console.log(type);
    const urlMapperEntity = await strapi.db.query(CUSTOM_LINKS_UID);
console.log('1111',data)
    return await urlMapperEntity.create({
      data
    });
  },
  async checkUrlExistBeforeUpdate(content_id,data,type,kind,id) {
    // console.log({ contentId: id, kind,type })
    const urlMapperEntity = await strapi.db.query(CUSTOM_LINKS_UID);
    let data1 = await urlMapperEntity.updateMany({
      where: { contentId: content_id, kind,type,id },
      data
    });
   return data1
  },
}));
