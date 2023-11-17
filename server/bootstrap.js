"use strict";
const { ValidationError } = require("@strapi/utils").errors;
const {
  getCustomLinksService,
  getSettingsService,
  CUSTOM_LINKS_UID,
  TEMPURI_UID,
  PLUGIN_ID,
} = require("./utils");
const transformMiddleware = require("./middlewares/transform");

module.exports = async ({ strapi }) => {
  // middleware add meta attribures custom-link
  transformMiddleware({ strapi });
  // check config current vs previous config
  await getSettingsService(strapi).checkConfig();
  // add lifecycles
  const config = getSettingsService(strapi).getConfig();
  const models = config.contentTypes;
  strapi.db.lifecycles.subscribe({
    models,
    async beforeCreate(event) {
      const { uri } = event.params.data;

      if (uri) {
        // clear tempuri
        await strapi.db.query(TEMPURI_UID).deleteMany({
          where: {
            id: {
              $notNull: true,
            },
          },
        });
        // record uri to tempuri
        const data = {
          uri,
        };
        await strapi.db.query(TEMPURI_UID).create({
          data,
        });
      }
      try {
        const { data, where, select, populate } = event.params;

        const isUrlExists = await strapi
          .plugin(PLUGIN_ID)
          .service("customLinks")
          .checkUrlExistBeforeCreate(data, uri);

        if (isUrlExists) {
          throw new ValidationError("Url already exists");
        }
      } catch (error) {
        console.log("Error adding slug mapper", error);
        throw error;
      }
    },
    async afterCreate(event) {
      const { id } = event.result;
      const { uid, kind } = event.model;
      const uriResult = await strapi.db.query(TEMPURI_UID).delete({
        where: {
          uri: {
            $notNull: true,
          },
        },
      });
      try {
        const { result, params } = event;
        const data = {
          kind: uid,
          contentId: id,
          uri: uriResult?.uri,
          type: kind,
        };

        let finalData = await strapi
          .plugin(PLUGIN_ID)
          .service("customLinks")
          .createUrlMapperEntity(data);
      } catch (error) {
        console.log("Error", error);
        throw error;
      }
    },
    async beforeUpdate(event) {
      const { id } = event.params.where;
      let { uri } = event.params.data;
      const { uid, kind } = event.model;
      // console.log(event.params,event.model)
      const result = await strapi.db.query(CUSTOM_LINKS_UID).findOne({
        where: { kind: uid, contentId: id },
      });
     
      if (result) {
        // update or delete
        // if (uri) {
        if (uri == undefined) {
        } else if (uri != result?.uri) {
          // update custom link
          const data = {
            uri,
          };
          console.log(data);
          await strapi
            .plugin(PLUGIN_ID)
            .service("customLinks")
            .checkUrlExistBeforeUpdate(
              result?.contentId,
              data,
              result?.type,
              result?.kind,
              result?.id
            );
        } else {
          // console.log("-----");
        }
      } else {
        const data = {
          kind: uid,
          contentId: id,
          uri,
          type: kind,
        };
        let finalData = await strapi
          .plugin(PLUGIN_ID)
          .service("customLinks")
          .createUrlMapperEntity(data);
      }
      // } else {
      //   // no custom link but uri is not null so create a new custom link
      //   const data = {
      //     kind: uid,
      //     contentId: id,
      //     uri,
      //     type : kind
      //   };
      //   let finalData = await strapi.plugin(PLUGIN_ID).service('customLinks').createUrlMapperEntity(data);
      // }
    },
    async afterDelete(event) {
      if (event.result) {
        const { id } = event.result;
        const { uid } = event.model;
        if (id) {
          const result = await strapi.entityService.findMany(CUSTOM_LINKS_UID, {
            filters: { kind: uid, contentId: id },
          });
          if (result && result.length) {
            await getCustomLinksService(strapi).delete(result[0].id);
          }
        }
      }
    },
    async afterDeleteMany(event) {
      if (event.result) {
        const { count } = event.result;
        let ids = [];
        try {
          ids = event.params.where.$and[0].id.$in;
        } catch (e) {
          ids = [];
        }

        const { uid } = event.model;
        if (count && count >= 1) {
          const data = await strapi.entityService.findMany(CUSTOM_LINKS_UID, {
            filters: { kind: uid, contentId: { $in: ids } },
          });
          const plIds = data.map((item) => item.id);
          await getCustomLinksService(strapi).deleteMany(plIds);
        }
      }
    },
    async afterFindOne(event) {
      if (event.result) {
        const { model, result } = event;
        const data = await strapi.entityService.findMany(CUSTOM_LINKS_UID, {
          filters: { kind: model.uid, contentId: result.id },
        });
        // add ____cl____ for meta insertion via middleware
        if (data && data.length) {
          event.result.____cl____ = {};
          event.result.____cl____.id = data[0].id;
          event.result.____cl____.uri = data[0].uri;
          event.result.____cl____.kind = data[0].kind;
          event.result.____cl____.contentId = data[0].contentId;
        }
      }
    },
  });

  const configuration = await strapi
    .plugin("content-manager")
    .service("content-types")
    .findConfiguration(strapi.contentTypes[CUSTOM_LINKS_UID]);
  configuration.layouts.edit = [[{ name: "uri", size: 6 }]];
  configuration.layouts.list = ["uri"];
  await strapi
    .plugin("content-manager")
    .service("content-types")
    .updateConfiguration(strapi.contentTypes[CUSTOM_LINKS_UID], configuration);
  const actions = [
    {
      section: "plugins",
      displayName: "Access the plugin settings",
      uid: "settings.read",
      pluginName: PLUGIN_ID,
    },
    {
      section: "plugins",
      displayName: "Update the plugin settings",
      uid: "settings.update",
      pluginName: PLUGIN_ID,
    },
    {
      section: "plugins",
      displayName: "Access the Custom Links list",
      uid: "menu-link.read",
      pluginName: PLUGIN_ID,
    },
  ];
  await strapi.admin.services.permission.actionProvider.registerMany(actions);
};
