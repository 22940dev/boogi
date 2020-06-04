// 08:46
require('dotenv').config();
const queries = require('./src/utils/algolia');
const readConfig = require('./config/config-reader');
const writeConfig = require('./config/config-js-writer');
const path = require('path');
const globImporter = require('node-sass-glob-importer');

const config = readConfig();
writeConfig(__dirname + '/.generated.config.js', config);

const plugins = [
  'gatsby-plugin-sitemap',
  {
    resolve: 'gatsby-plugin-sass',
    options: {
      importer: globImporter(),
    },
  },
  'gatsby-plugin-sharp',
  {
    resolve: `gatsby-plugin-layout`,
    options: {
      component: require.resolve(`./src/templates/docs.js`),
    },
  },
  'gatsby-plugin-emotion',
  'gatsby-plugin-remove-trailing-slashes',
  'gatsby-transformer-sharp',
  {
    resolve: 'gatsby-plugin-react-svg',
    options: {
      rule: {
        include: /\.inline\.svg$/,
      },
    },
  },
  'gatsby-plugin-react-helmet',
  'gatsby-source-local-git',
  {
    resolve: 'gatsby-source-filesystem',
    options: {
      name: 'docs',
      path: `${__dirname}/content/`,
    },
  },
  {
    resolve: `gatsby-transformer-gitinfo`,
    options: {
      include: /\.mdx?$/i, // Only .md files
    },
  },
  {
    resolve: 'gatsby-plugin-mdx',
    options: {
      remarkPlugins: [require('remark-emoji'), require('remark-abbr')],
      gatsbyRemarkPlugins: [
        {
          resolve: 'gatsby-remark-mermaid',
          options: {
            language: config.features.mermaid.language,
            theme: config.features.mermaid.theme,
            viewport: {
                width: config.features.mermaid.width,
                height: config.features.mermaid.height
            },
            mermaidOptions: config.features.mermaid.options
          }
        },
        {
          resolve: 'gatsby-remark-images',
          options: {
            maxWidth: 1035,
            sizeByPixelDensity: true,
          },
        },
        {
          resolve: 'gatsby-remark-copy-linked-files',
        },
        {
          resolve: 'gatsby-remark-jargon',
          options: { jargon: require('./config/jargon-config.js') },
        },
        {
          resolve: 'gatsby-remark-sectionize',
        },
        {
          resolve: `gatsby-remark-embed-snippet`,
          options: {
            directory: `${__dirname}/snippets/`,
          },
        },
      ],
      extensions: ['.mdx', '.md'],
    },
  },
  {
    resolve: `gatsby-plugin-gtag`,
    options: {
      // your google analytics tracking id
      trackingId: config.metadata.gaTrackingId,
      // Puts tracking script in the head instead of the body
      head: true,
      // enable ip anonymization
      anonymize: false,
    },
  },
  {
    resolve: 'gatsby-plugin-root-import',
    options: {
      '~': path.join(__dirname, 'src'),
      config: path.join(__dirname, '.generated.config.js'),
      images: path.join(__dirname, 'src/images'),
      styles: path.join(__dirname, 'src/styles'),
      css: path.join(__dirname, 'src/styles/main.scss'),
    },
  },
];

if (config.features.pageProgress && config.features.pageProgress.enabled) {
  plugins.push(
    {
      resolve: "gatsby-plugin-page-progress",
      options: {
        includePaths: config.features.pageProgress.includePaths,
        excludePaths: config.features.pageProgress.excludePaths,
        height: config.features.pageProgress.height,
        prependToBody: config.features.pageProgress.prependToBody,
        color: config.features.pageProgress.color
      }
    });
}
// check and add algolia
if (
  config.features.search &&
  config.features.search.enabled &&
  config.features.search.algoliaAppId &&
  config.features.search.algoliaAdminKey
) {
  plugins.push({
    resolve: `gatsby-plugin-algolia`,
    options: {
      appId: config.features.search.algoliaAppId, // algolia application id
      apiKey: config.features.search.algoliaAdminKey, // algolia admin key to index
      queries,
      chunkSize: 10000, // default: 1000
    },
  });
}
// check and add pwa functionality
if (config.pwa && config.pwa.enabled && config.pwa.manifest) {
  plugins.push({
    resolve: `gatsby-plugin-manifest`,
    options: { ...config.pwa.manifest },
  });
  plugins.push({
    resolve: 'gatsby-plugin-offline',
    options: {
      appendScript: require.resolve(`./src/custom-sw-code.js`),
    },
  });
  // plugins.push('gatsby-plugin-offline');
} else {
  plugins.push('gatsby-plugin-remove-serviceworker');
}

module.exports = {
  pathPrefix: config.metadata.pathPrefix,
  siteMetadata: {
    title: config.metadata.name,
    description: config.metadata.description,
    docsLocation: config.metadata.docsLocation,
    docsLocationType: config.metadata.docsLocationType,
    editable: config.metadata.editable,
    ogImage: config.metadata.ogImage,
    favicon: config.metadata.favicon,
    logo: {
      link: config.header.logoLink ? config.header.logoLink : '/',
      image: config.header.logo,
    }, // backwards compatible
    headerTitle: config.metadata.name,
    helpUrl: config.header.helpUrl,
    headerLinks: config.header.links,
    siteUrl: config.metadata.url,
  },
  plugins: plugins,
};
