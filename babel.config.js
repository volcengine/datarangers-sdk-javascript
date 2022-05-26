'use strict';

const presets = [
  [
    '@babel/preset-env',
    {
      targets: [
        'last 7 versions',
        'ie >= 8',
        'ios >= 8',
        'android >= 4.0',
      ].join(','),
      useBuiltIns: 'false',
      corejs: { version: 3, proposals: true },
      modules: false, // 交给rollup处理模块化 https://babeljs.io/docs/en/babel-preset-env#
      loose: true, // 非严格es6
      debug: false
    },
  ],
  '@babel/preset-typescript',
  '@babel/preset-flow',
];

const plugins = [
  ['@babel/plugin-proposal-class-properties', { loose: false }],
];

module.exports = { presets, plugins }