'use strict';

/**
 * 仅挂 web-mobile 构建钩子，不注册面板 / options，避免 panelInfo 报错。
 */
exports.configs = {
  'web-mobile': {
    hooks: './hooks',
  },
};
