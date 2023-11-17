# Strapi plugin URL Mapper

This plugin is used to create and edit URL for different ContentTypes..

# Getting Started

The plugin can be tested in strapi version 4.14.6 node vesrion above 18.0.0 and less than 20.0.0

# To Install

    1.Go into your strapi project.
    2.Run the npm command npm i url-mapper
    3.The plugin will be added to your strapi project.

# Note

Alternatively, you can create a file custom-links.js inside the folder config of your strapi project.

The file look like this:

        module.exports = {
        contentTypes: ['api::mycontenttype.mycontenttype', 'api::othercontentype.othercontentype'],
        };

When editing a Content-Type, you will find at the right section a URL Mapper block, in which you can create or update a URLs by editing this field.