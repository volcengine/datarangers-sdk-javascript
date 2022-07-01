import babel from 'rollup-plugin-babel';
import replace from 'rollup-plugin-replace';
import json from 'rollup-plugin-json';
import cleanup from 'rollup-plugin-cleanup';
import filesize from 'rollup-plugin-filesize';
import progress from 'rollup-plugin-progress';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import strip from 'rollup-plugin-strip';
import ts from 'rollup-plugin-typescript2';

import { version, description } from './package.json'

const exec = require('child_process').exec;
exec('rm -rf ./core', function(err, stdout, stderr) {
  if (err) {
    console.log(err.message);
  }
  console.log(stdout);
  console.log(stderr);
});

const commonPlugins = [
  strip({
    debugger: true,
    functions: ['assert.*', 'debug', 'alert'],
    sourceMap: true,
  }),
  json(),
  filesize(),
  progress(),
  cleanup(),
  terser(),
];

const replaceOptions = {
  'process.env.SDK_VERSION': JSON.stringify(version),
  'process.env.SDK_DESC': JSON.stringify(description),
};
const logSDKCommonPlugins = [
  replace({
    delimiters: ['', ''],
    values: replaceOptions,
  }),
  ts(),
  babel({
    exclude: ['node_modules/**','src/util/sizzle.js'],
    extensions: ['.js', '.ts'],
    presets: [
      [
        '@babel/preset-env',
        {
          targets: [
            'last 7 versions',
            'ie >= 8',
            'ios >= 8',
            'android >= 4.0',
          ].join(','),
          useBuiltIns: 'usage',
          corejs: { version: 3, proposals: true },
          modules: false, // 交给rollup处理模块化 https://babeljs.io/docs/en/babel-preset-env#
          loose: true, // 非严格es6
          debug: false
        },
      ],
      '@babel/preset-typescript',
      '@babel/preset-flow',
    ]
  }),
  resolve(), // 常规配套使用
  commonjs(),
  ...commonPlugins,
];

const logFullSDKEntry = [
  {
    input: 'src/entry/entry.ts',
    output: [
      {
        file: 'core/lib/index<%insert%>.min.js',
        format: 'cjs',
      },
    ],
  },
  {
    input: 'src/entry/entry.ts',
    output: [
      {
        file: 'core/es/index<%insert%>.min.js',
        format: 'es',
      },
    ],
  }
]


function getFullBundlesWithReplace(replaceObj, outputName) {
  const copyLogFullSDKEntry = JSON.parse(JSON.stringify(logFullSDKEntry))
  return [
    copyLogFullSDKEntry
  ].map(mainConfig => mainConfig.map((outputConfig) => {
    // 替换输出的文件名
    outputConfig.output.forEach((item) => {
      item.file = item.file.replace('<%insert%>', outputName ? `-${outputName}` : '');
    });
    // 添加replace配置
    outputConfig.plugins = [
      replace({
        delimiters: ['', ''],
        values: replaceObj,
      }),
      ...logSDKCommonPlugins,
    ];
    return outputConfig;
  }));
}

export default [].concat(
  ...getFullBundlesWithReplace({
    '/**@@SDK': '//',
    '@@SDK*/': '//',
  },
  '',
  )
);
