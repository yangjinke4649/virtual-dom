import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
export default {
  input: './index.js',
  output: {
    file: './dist/bundle.js',
    format: 'iife',
    name: 'VirtualDom',
    sourcemap: true
  },
  plugins: [
    resolve(), 
    commonjs()
  ]
}