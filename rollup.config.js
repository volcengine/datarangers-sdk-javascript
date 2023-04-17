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

const exec = require('child_process').exec;
exec('rm -rf ./output', function(err, stdout, stderr) {
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

// npm publish --access=public

const replaceOptions = {
  'process.env.SDK_TYPE': 'npm',
  'process.env.SDK_TARGET': 'tob',
};
const logSDKCommonPlugins = [
  replace({
    delimiters: ['', ''],
    values: replaceOptions,
  }),
  ts(),
  babel({
    exclude: 'node_modules/**',
    extensions: ['.js', '.ts'],
  }),
  resolve(), // 常规配套使用
  commonjs(),
  ...commonPlugins,
];

const logBaseSDKEntry = [
  {
    input: 'src/entry/entry.ts',
    output: [
      {
        file: 'lib/index<%insert%>.min.js',
        format: 'cjs',
      },
    ],
  },
  {
    input: 'src/entry/entry.ts',
    output: [
      {
        file: 'es/index<%insert%>.min.js',
        format: 'es',
      },
    ],
  }
]

/**
 * 塞入额外的replace。
 * 返回 npm 配置对象
 * @param {*} replaceObj
 */
function getBaseBundlesWithReplace(replaceObj, outputName) {
  const copyLogBaseSDKEntry = JSON.parse(JSON.stringify(logBaseSDKEntry))
  return [
    copyLogBaseSDKEntry
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
  ...getBaseBundlesWithReplace({
    '/**@@SDK': '//',
    '@@SDK*/': '//',
  },
  '',
  )
);
